import Foundation

public enum PansClawCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum PansClawCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum PansClawCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum PansClawCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct PansClawCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: PansClawCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: PansClawCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: PansClawCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: PansClawCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct PansClawCameraClipParams: Codable, Sendable, Equatable {
    public var facing: PansClawCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: PansClawCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: PansClawCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: PansClawCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
