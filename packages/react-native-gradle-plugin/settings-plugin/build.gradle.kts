/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.internal.classpath.ModuleRegistry
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.configurationcache.extensions.serviceOf
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  alias(libs.plugins.kotlin.jvm)
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

gradlePlugin {
  plugins {
    create("react.settings") {
      id = "com.facebook.react.settings"
      implementationClass = "com.facebook.react.ReactSettingsPlugin"
    }
  }
}

group = "com.facebook.react"

dependencies {
  implementation(project(":shared"))

  implementation(gradleApi())
  implementation(libs.gson)
  implementation(libs.guava)
  implementation(libs.javapoet)

  testImplementation(libs.junit)

  testRuntimeOnly(
      files(
          serviceOf<ModuleRegistry>()
              .getModule("gradle-tooling-api-builders")
              .classpath
              .asFiles
              .first()))
}

// We intentionally don't build for Java 17 as users will see a cryptic bytecode version
// error first. Instead we produce a Java 11-compatible Gradle Plugin, so that AGP can print their
// nice message showing that JDK 11 (or 17) is required first
java { targetCompatibility = JavaVersion.VERSION_11 }

kotlin { jvmToolchain(17) }

tasks.withType<KotlinCompile>().configureEach {
  kotlinOptions {
    apiVersion = "1.6"
    // See comment above on JDK 11 support
    jvmTarget = "11"
    allWarningsAsErrors = true
  }
}

tasks.withType<Test>().configureEach {
  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
