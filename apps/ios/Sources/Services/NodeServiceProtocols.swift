import CoreLocation
import Foundation
import PansClawKit
import UIKit

typealias PansClawCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias PansClawCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: PansClawCameraSnapParams) async throws -> PansClawCameraSnapResult
    func clip(params: PansClawCameraClipParams) async throws -> PansClawCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: PansClawLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: PansClawLocationGetParams,
        desiredAccuracy: PansClawLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: PansClawLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> PansClawDeviceStatusPayload
    func info() -> PansClawDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: PansClawPhotosLatestParams) async throws -> PansClawPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: PansClawContactsSearchParams) async throws -> PansClawContactsSearchPayload
    func add(params: PansClawContactsAddParams) async throws -> PansClawContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: PansClawCalendarEventsParams) async throws -> PansClawCalendarEventsPayload
    func add(params: PansClawCalendarAddParams) async throws -> PansClawCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: PansClawRemindersListParams) async throws -> PansClawRemindersListPayload
    func add(params: PansClawRemindersAddParams) async throws -> PansClawRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: PansClawMotionActivityParams) async throws -> PansClawMotionActivityPayload
    func pedometer(params: PansClawPedometerParams) async throws -> PansClawPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: PansClawWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
