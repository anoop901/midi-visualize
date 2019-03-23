# midi-visualize
Web-based midi visualizer. Uses a frontend and backend

## How to run

Before starting, make sure you have [Node and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

Clone this repository, and `cd` to the root directory in a terminal.

### Frontend
Build the frontend:
```
cd frontend
npm install
npm run build
```

### Backend
Go to backend directory (if on Windows, replace forward slash `/` with backslash `\`)
```
cd ../backend-node
```

Install the implicit indirect dependencies (of the npm `midi` package) listed for your platform [here](https://www.npmjs.com/package/midi#prerequisites).

Install direct dependencies and run the server:
```
npm install
node index.js
```

Now it should print the port number, such as 3000. You can view the visualization by navigating your browser to [http://localhost:3000](http://localhost:3000).
If you want to put it on a stream, you can use OBS's browser source (or equivalent in other streaming software).
