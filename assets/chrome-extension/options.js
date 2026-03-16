import { deriveRelayToken } from './background-utils.js'
import { classifyRelayCheckException, classifyRelayCheckResponse } from './options-validation.js'

const DEFAULT_PORT = 18792

function getBannerElements() {
  return {
    banner: document.getElementById('setup-banner'),
    title: document.getElementById('setup-banner-title'),
    text: document.getElementById('setup-banner-text'),
  }
}

function setBanner(kind, title, text) {
  const elements = getBannerElements()
  if (!elements.banner || !elements.title || !elements.text) return
  elements.banner.dataset.kind = kind || 'info'
  elements.title.textContent = title || ''
  elements.text.textContent = text || ''
}

function setDashboardEntryState(port, enabled) {
  const button = document.getElementById('open-dashboard')
  if (!button) return
  button.disabled = !enabled
  const gatewayPort = Math.max(1, Number(port) - 3)
  button.title = enabled
    ? `Open Dashboard at http://127.0.0.1:${gatewayPort}/`
    : 'Save a valid token first to enable quick entry'
}

function openDashboardFromRelayPort(port) {
  const gatewayPort = Math.max(1, Number(port) - 3)
  const dashboardUrl = `http://127.0.0.1:${gatewayPort}/`
  void chrome.tabs.create({ url: dashboardUrl })
}

function clampPort(value) {
  const n = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(n)) return DEFAULT_PORT
  if (n <= 0 || n > 65535) return DEFAULT_PORT
  return n
}

function updateRelayUrl(port) {
  const el = document.getElementById('relay-url')
  if (!el) return
  el.textContent = `http://127.0.0.1:${port}/`
}

function setStatus(kind, message) {
  const status = document.getElementById('status')
  if (!status) return
  status.dataset.kind = kind || ''
  status.textContent = message || ''
}

async function checkRelayWithToken(url, token) {
  return await chrome.runtime.sendMessage({
    type: 'relayCheck',
    url,
    token,
  })
}

function updateSetupState(port, token, setupNotice) {
  const trimmedToken = String(token || '').trim()
  if (!trimmedToken) {
    setBanner(
      'error',
      'Gateway token required',
      'This extension cannot connect until you paste gateway.auth.token below. Port 18792 is already the correct default.',
    )
    return
  }

  if (setupNotice === 'auth-failed') {
    setBanner(
      'error',
      'Token was rejected',
      'The relay is reachable, but the saved Gateway token was rejected. Paste the current gateway.auth.token and save again.',
    )
    return
  }

  if (setupNotice === 'relay-unreachable') {
    setBanner(
      'error',
      'Relay is not running',
      `The extension has a token, but the relay at http://127.0.0.1:${port}/ is not reachable yet. Start the PansClaw browser relay, then try again.`,
    )
    return
  }

  setBanner(
    'info',
    'Ready to connect',
    `Port ${port} is configured. Click Save once after changing the token, then use the toolbar button on any tab.`,
  )
}

async function checkRelayReachable(port, token) {
  const url = `http://127.0.0.1:${port}/json/version`
  const trimmedToken = String(token || '').trim()
  if (!trimmedToken) {
    setStatus('error', 'Gateway token required. Save your gateway token to connect.')
    await chrome.storage.local.set({ setupNotice: 'missing-token' })
    return false
  }
  try {
    const relayToken = await deriveRelayToken(trimmedToken, port)
    const candidateTokens = relayToken === trimmedToken ? [relayToken] : [relayToken, trimmedToken]

    let lastResult = null
    for (const candidateToken of candidateTokens) {
      // Delegate the fetch to the background service worker to bypass
      // CORS preflight on the custom x-openclaw-relay-token header.
      const res = await checkRelayWithToken(url, candidateToken)
      const result = classifyRelayCheckResponse(res, port)
      lastResult = result

      if (result.action === 'throw') {
        throw new Error(result.error)
      }

      if (result.kind === 'ok') {
        const compatibility = candidateToken === trimmedToken && relayToken !== trimmedToken
        setStatus(
          'ok',
          compatibility
            ? `Relay reachable and authenticated at http://127.0.0.1:${port}/ (compatibility mode: raw gateway token).`
            : result.message,
        )
        await chrome.storage.local.set({ setupNotice: 'ready' })
        return true
      }
    }

    if (lastResult) {
      setStatus(lastResult.kind, lastResult.message)
      if (lastResult.message.toLowerCase().includes('token rejected')) {
        await chrome.storage.local.set({ setupNotice: 'auth-failed' })
        return false
      }
    }
  } catch (err) {
    const result = classifyRelayCheckException(err, port)
    setStatus(result.kind, result.message)
    await chrome.storage.local.set({ setupNotice: 'relay-unreachable' })
  }

  return false
}

async function load() {
  const stored = await chrome.storage.local.get(['relayPort', 'gatewayToken', 'setupNotice'])
  const port = clampPort(stored.relayPort)
  const token = String(stored.gatewayToken || '').trim()
  document.getElementById('port').value = String(port)
  document.getElementById('token').value = token
  updateRelayUrl(port)
  setDashboardEntryState(port, false)
  updateSetupState(port, token, stored.setupNotice)
  const ready = await checkRelayReachable(port, token)
  setDashboardEntryState(port, ready)
  const refreshed = await chrome.storage.local.get(['setupNotice'])
  updateSetupState(port, token, refreshed.setupNotice)
}

async function save() {
  const portInput = document.getElementById('port')
  const tokenInput = document.getElementById('token')
  const port = clampPort(portInput.value)
  const token = String(tokenInput.value || '').trim()
  await chrome.storage.local.set({ relayPort: port, gatewayToken: token, helpOnErrorShown: false })
  portInput.value = String(port)
  tokenInput.value = token
  updateRelayUrl(port)
  setDashboardEntryState(port, false)
  updateSetupState(port, token, token ? 'ready' : 'missing-token')
  const ready = await checkRelayReachable(port, token)
  setDashboardEntryState(port, ready)
  const refreshed = await chrome.storage.local.get(['setupNotice'])
  updateSetupState(port, token, refreshed.setupNotice)

  if (ready) {
    openDashboardFromRelayPort(port)
  }
}

document.getElementById('save').addEventListener('click', () => void save())
document.getElementById('open-dashboard').addEventListener('click', () => {
  const port = clampPort(document.getElementById('port').value)
  openDashboardFromRelayPort(port)
})
void load()
