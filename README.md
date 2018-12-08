# midi-visualize
Web-based midi visualizer. Uses a frontend and backend

## How to run

Before starting, make sure you have [Node and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

Clone this repository, and `cd` to the root directory in a terminal.

Build the frontend:
```
cd frontend
npm install
npm run build
```

Run the server:
```
cd ../backend-node
npm install
node index.js
```

Now it should print the port number, such as 3000. You can view the visualization by navigating your browser to [http://localhost:3000](http://localhost:3000).
If you want to put it on a stream, you can use OBS's browser source (or equivalent in other streaming software).
