#!/bin/bash

# This script acts as a wrapper to call 'zig cc' with the correct arguments.

# Zig's native compiler/linker options for cross-compilation
ZIG_CC_NATIVE_ARGS=("-target" "x86_64-windows-gnu" "-windows-libs")

# Collect all other arguments passed to this script by rustc.
RUSTC_LINKER_ARGS=()
for arg in "$@"; do
    if [[ "$arg" == "-static-exe" ]]; then
        continue # Skip this flag
    fi
    RUSTC_LINKER_ARGS+=("$arg")
done

# Execute 'zig cc' with its native flags first, then all rustc-generated linker args.
# The EXPLICIT_LINK_LIBS will now be passed via RUSTFLAGS in config.toml
exec zig cc "${ZIG_CC_NATIVE_ARGS[@]}" "${RUSTC_LINKER_ARGS[@]}"#!/bin/bash

# This script acts as a wrapper to call 'zig cc' with the correct arguments.

# Zig's native compiler/linker options for cross-compilation.
# '-windows-libs' is crucial: it tells zig cc to provide Windows system libraries.
ZIG_CC_NATIVE_ARGS=("-target" "x86_64-windows-gnu" "-windows-libs")

# Collect all other arguments passed to this script by rustc.
# We explicitly filter out problematic flags that zig cc doesn't understand
# in this context (like '-static-exe' which is a Zig-specific build option).
RUSTC_LINKER_ARGS=()
for arg in "$@"; do
    if [[ "$arg" == "-static-exe" ]]; then
        continue # Skip this flag as it's not a standard Clang/GCC linker option
    fi
    RUSTC_LINKER_ARGS+=("$arg")
done

# Crucially, tell zig cc to look for dynamic libraries (DLLs) using their .dll.a import libraries.
# Also, ensure explicit linking for commonly needed Windows components and WebView2Loader.
# Note: '-lNAME' tells the linker to look for 'libNAME.a' or 'NAME.lib' or 'libNAME.dll.a' etc.
EXPLICIT_LINK_LIBS=(
    # Core Windows API libraries, often handled by -windows-libs but explicit can help
    "-lkernel32"
    "-luser32"
    "-lws2_32"
    "-lbcrypt"
    "-ladvapi32"
    "-lntdll"
    "-luserenv"
    "-ldbghelp"

    # Crucial for Tauri: WebView2Loader.
    # It will look for `libWebView2Loader.dll.a` or `WebView2Loader.lib`.
    "-lWebView2Loader"

    # Microsoft C Runtime for GNU target
    "-lmsvcrt"
)

# Execute 'zig cc' with its native flags first, then all rustc-generated linker args,
# and finally the explicitly requested libraries.
# The `exec` command replaces the current shell process with `zig cc`.
exec zig cc "${ZIG_CC_NATIVE_ARGS[@]}" "${RUSTC_LINKER_ARGS[@]}" "${EXPLICIT_LINK_LIBS[@]}"#!/bin/bash

# This script acts as a wrapper to call 'zig cc' with the correct arguments.

# Zig's native compiler/linker options that zig cc should *always* see for cross-compilation
# These typically come directly after 'zig cc'
ZIG_CC_NATIVE_ARGS=("-target" "x86_64-windows-gnu" "-windows-libs")

# Options that 'rustc' passes which zig cc should also receive.
# These are typically GCC/Clang-compatible flags.
# The '-static-exe' option is removed from here as it's not a standard clang option.
RUSTC_LINKER_ARGS=()

# Iterate through all arguments passed to this script by rustc
for arg in "$@"; do
    # We need to filter out flags that zig cc (as a clang wrapper) won't understand
    # '-static-exe' is the problematic one identified.
    if [[ "$arg" == "-static-exe" ]]; then
        # Do nothing, skip this flag as it's not for zig cc when acting as a clang linker.
        continue
    fi
    RUSTC_LINKER_ARGS+=("$arg")
done

# Execute 'zig cc' with its native flags first, then all the rustc-generated linker args.
exec zig cc "${ZIG_CC_NATIVE_ARGS[@]}" "${RUSTC_LINKER_ARGS[@]}"
