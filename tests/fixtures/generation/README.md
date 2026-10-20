# Generation fixtures

Plugin configs used by `npm run check:generation` (spec 003, FR-008 to FR-011). Each one is generated into a temporary folder, installed, built, linted and unit-tested.

| Fixture | Mode |
| --- | --- |
| `default.json` | Content model: a post type with a taxonomy and fields |
| `functional-only.json` | Functional-only (`content_model: "none"`, spec 002) |

They hold test-only metadata, so the leftover-placeholder scan can flag any scaffold example value (`example-plugin`, `Example Author`) that reaches a generated plugin.
