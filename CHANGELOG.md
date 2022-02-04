## Changelog

## [3.5.3](https://github.com/logdna/nodejs/compare/v3.5.2...v3.5.3) (2022-02-04)


### Bug Fixes

* **ci**: Switch to Jenkins and semantic-release [90ac36e](https://github.com/logdna/nodejs/commit/90ac36e77dbeae1cfd9b8a83d3f7d7565a5dc917) - Darin Spivey, closes: [#110](https://github.com/logdna/nodejs/issues/110)


### Chores

* **deps**: axios@0.25.0 [40c3283](https://github.com/logdna/nodejs/commit/40c3283949bd7d9745f715309c65c2f6031b34f4) - Darin Spivey, closes: [#111](https://github.com/logdna/nodejs/issues/111)

# CHANGELOG

This file documents all notable changes in `LogDNA Node.js Code Library`. The release numbering uses [semantic versioning](http://semver.org).

## v3.5.2 - January 13, 2021
It should be noted that this project is still deprecated! This security update is being
done strictly for the safety of legacy users who may still be using it.

- Upgrade to axios@0.21.1 which fixes an SSRF vulnerability

## v3.5.1 - July 17, 2020
- Missing key logdna_url in ConstructorOptions [#96](https://github.com/logdna/nodejs/pull/96)
- Convert to `tap` for testing [#99](https://github.com/logdna/nodejs/pull/99)
- Missing tags from ConstructorOptions [#98](https://github.com/logdna/nodejs/pull/98)

## v3.5.0 - February 21, 2020
- Set user-agent header only in node [#87](https://github.com/logdna/nodejs/pull/87)
- Add type definition for typescript [#71](https://github.com/logdna/nodejs/pull/71)
- Try to flush after failing without waiting for the next log [#93](https://github.com/logdna/nodejs/pull/93)

## 3.4.0 - November 15, 2019
- Add `shimProperties` option to support custom fields in messages [#83](https://github.com/logdna/nodejs/pull/83)
- Add callback parameter to the methods [#73](https://github.com/logdna/nodejs/pull/73)
- Apply `no-var` linting rule [#80](https://github.com/logdna/nodejs/pull/80)
- Fix the tests regarding the recent updates [#82](https://github.com/logdna/nodejs/pull/82)

## 3.3.3 - September 20, 2019
- Add User Agent to the Request Header [#74](https://github.com/logdna/nodejs/pull/74)

## 3.3.2 - September 8, 2019
- Support for the following fields: `appOverride`, `logSourceCRN`, and `saveServiceCopy` [#72](https://github.com/logdna/nodejs/pull/72)

## 3.3.1 - September 3, 2019
- Metadata Support Bug Fix [#70](https://github.com/logdna/nodejs/pull/70)

## 3.3.0 - August 20, 2019
- HTTP Exception Handling [#62](https://github.com/logdna/nodejs/pull/62)
- Default Metadata Support [#60](https://github.com/logdna/nodejs/pull/60)

[3.5.2]: https://github.com/logdna/nodejs/compare/v3.5.1...v3.5.2
[3.5.1]: https://github.com/logdna/nodejs/compare/v3.5.0...v3.5.1
[3.5.0]: https://github.com/logdna/nodejs/compare/3.4.0...v3.5.0
[3.4.0]: https://github.com/logdna/nodejs/compare/3.3.3...3.4.0
[3.3.3]: https://github.com/logdna/nodejs/compare/3.3.2...3.3.3
[3.3.2]: https://github.com/logdna/nodejs/compare/3.3.1...3.3.2
[3.3.1]: https://github.com/logdna/nodejs/compare/3.3.0...3.3.1
[3.3.0]: https://github.com/logdna/nodejs/releases/tag/3.3.0
