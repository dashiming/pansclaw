import Foundation

public enum PansClawDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum PansClawBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum PansClawThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum PansClawNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum PansClawNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct PansClawBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: PansClawBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: PansClawBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct PansClawThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: PansClawThermalState

    public init(state: PansClawThermalState) {
        self.state = state
    }
}

public struct PansClawStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct PansClawNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: PansClawNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [PansClawNetworkInterfaceType]

    public init(
        status: PansClawNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [PansClawNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct PansClawDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: PansClawBatteryStatusPayload
    public var thermal: PansClawThermalStatusPayload
    public var storage: PansClawStorageStatusPayload
    public var network: PansClawNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: PansClawBatteryStatusPayload,
        thermal: PansClawThermalStatusPayload,
        storage: PansClawStorageStatusPayload,
        network: PansClawNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct PansClawDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
