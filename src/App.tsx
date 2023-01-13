import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import configurationService from "./configService";

function App() {
  const [count, setCount] = useState(0);

  console.log("The rules store", configurationService.__ruleStore);

  // this works in dev mode, with all ES modules accessible and separated
  configurationService.selectAsync(import.meta.url).then((value) => {
    console.log("The resolved config", value);
  });

  // but in production mode the module is bundled and the path becomes different
  // so lets have the code knowing its name and resolving it instead
  configurationService
    .selectAsync(import.meta.resolve?.("./App.tsx") as unknown as string)
    .then((value) => {
      console.log("The resolved config (via import.meta.resolve)", value);
    });

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
