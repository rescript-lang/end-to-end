@@directive("'use client';")

module Provider = {
  @react.component
  let make = (~children) => {
    let (count, setCount) = React.useState(() => 0)
    <section id="provider">
      <button onClick={_ => setCount(count => count + 1)}>
        {React.string("Count: ")}
        {React.int(count)}
      </button>
      {children}
    </section>
  }
  // Incremental test: rebind this component without changing its interface.
}

module Group = {
  module Provider = {
    @react.component
    let make = (~children) => <div id="deep">{children}</div>
  }
}

module Memo = {
  @react.component
  let make = React.memo((~children) => <div id="memo">{children}</div>)
}

module Hidden = {
  @react.component
  let make = (~children) => <div id="private">{children}</div>
}

module WithPrivate = {
  @react.component
  let make = (~children) => <Hidden>{children}</Hidden>
}

module Sidebar = {
  @react.component
  let make = (~children) => <div id="same-name">{children}</div>
}

module External = {
  @react.component @module("./ExternalCounter.js")
  external make: (~children: React.element) => React.element = "default"
}
