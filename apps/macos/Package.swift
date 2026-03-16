// swift-tools-version: 6.2
// Package manifest for the PansClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "PansClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "PansClawIPC", targets: ["PansClawIPC"]),
        .library(name: "PansClawDiscovery", targets: ["PansClawDiscovery"]),
        .executable(name: "PansClaw", targets: ["PansClaw"]),
        .executable(name: "openclaw-mac", targets: ["PansClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/PansClawKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "PansClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "PansClawDiscovery",
            dependencies: [
                .product(name: "PansClawKit", package: "PansClawKit"),
            ],
            path: "Sources/PansClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "PansClaw",
            dependencies: [
                "PansClawIPC",
                "PansClawDiscovery",
                .product(name: "PansClawKit", package: "PansClawKit"),
                .product(name: "PansClawChatUI", package: "PansClawKit"),
                .product(name: "PansClawProtocol", package: "PansClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/PansClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "PansClawMacCLI",
            dependencies: [
                "PansClawDiscovery",
                .product(name: "PansClawKit", package: "PansClawKit"),
                .product(name: "PansClawProtocol", package: "PansClawKit"),
            ],
            path: "Sources/PansClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "PansClawIPCTests",
            dependencies: [
                "PansClawIPC",
                "PansClaw",
                "PansClawDiscovery",
                .product(name: "PansClawProtocol", package: "PansClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
