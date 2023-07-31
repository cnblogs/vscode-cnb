#!/usr/bin/env bash

npm run format
npm run lint

declare para='--manifest-path rs/Cargo.toml'
cargo fmt $para
cargo clippy $para
