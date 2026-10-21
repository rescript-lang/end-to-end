@react.component
let make = () => {
  <main>
    <h1>{React.string("Nested client components")}</h1>
    <Reexport.Provider>
      <Sidebar.Group.Provider>
        <Sidebar.Memo>
          <Sidebar.WithPrivate>
            <Sidebar.Sidebar>
              <Sidebar.External>
                <p>{React.string("Server child")}</p>
              </Sidebar.External>
            </Sidebar.Sidebar>
          </Sidebar.WithPrivate>
        </Sidebar.Memo>
      </Sidebar.Group.Provider>
    </Reexport.Provider>
  </main>
}
