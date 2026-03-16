import Foundation

public enum PansClawChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(PansClawChatEventPayload)
    case agent(PansClawAgentEventPayload)
    case seqGap
}

public protocol PansClawChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> PansClawChatHistoryPayload
    func listModels() async throws -> [PansClawChatModelChoice]
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [PansClawChatAttachmentPayload]) async throws -> PansClawChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> PansClawChatSessionsListResponse
    func setSessionModel(sessionKey: String, model: String?) async throws
    func setSessionThinking(sessionKey: String, thinkingLevel: String) async throws

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<PansClawChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
    func resetSession(sessionKey: String) async throws
}

extension PansClawChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func resetSession(sessionKey _: String) async throws {
        throw NSError(
            domain: "PansClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.reset not supported by this transport"])
    }

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "PansClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> PansClawChatSessionsListResponse {
        throw NSError(
            domain: "PansClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }

    public func listModels() async throws -> [PansClawChatModelChoice] {
        throw NSError(
            domain: "PansClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "models.list not supported by this transport"])
    }

    public func setSessionModel(sessionKey _: String, model _: String?) async throws {
        throw NSError(
            domain: "PansClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(model) not supported by this transport"])
    }

    public func setSessionThinking(sessionKey _: String, thinkingLevel _: String) async throws {
        throw NSError(
            domain: "PansClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(thinkingLevel) not supported by this transport"])
    }
}
