module Provider: {
  @react.component
  let make: (~children: React.element) => React.element
}

module Group: {
  module Provider: {
    @react.component
    let make: (~children: React.element) => React.element
  }
}

module Memo: {
  @react.component
  let make: (~children: React.element) => React.element
}

module WithPrivate: {
  @react.component
  let make: (~children: React.element) => React.element
}

module Sidebar: {
  @react.component
  let make: (~children: React.element) => React.element
}

module External: {
  // Preserve a manually written FFI interface as well as annotated components.
  type props<'children> = {children: 'children}
  @module("./ExternalCounter.js")
  external make: React.component<props<React.element>> = "default"
}
