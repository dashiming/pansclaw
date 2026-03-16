// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "PansClawKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "PansClawProtocol", targets: ["PansClawProtocol"]),
        .library(name: "PansClawKit", targets: ["PansClawKit"]),
        .library(name: "PansClawChatUI", targets: ["PansClawChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "PansClawProtocol",
            path: "Sources/PansClawProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "PansClawKit",
            dependencies: [
                "PansClawProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/PansClawKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "PansClawChatUI",
            dependencies: [
                "PansClawKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/PansClawChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "PansClawKitTests",
            dependencies: ["PansClawKit", "PansClawChatUI"],
            path: "Tests/PansClawKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
