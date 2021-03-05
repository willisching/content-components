#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT="${DIR}/.."
MIRROR="${ROOT}/mirror"

rm -rf "${MIRROR}"
mkdir -p "${MIRROR}"
ln -s "${ROOT}/locales" "${MIRROR}/locales"
ln -s "${ROOT}/src" "${MIRROR}/src"
ln -s "${ROOT}/package.json" "${MIRROR}/package.json"
ln -s "${ROOT}/polymer.json" "${MIRROR}/polymer.json"
