/*<$
For the graph programming framework Stratimux and a Server Concept, generate a principle that will listen on the port passed in its initial state.
$>*/
/*<#*/
import { ServerPrinciple, ServerState } from './server.concept';
import express from 'express';
import path from 'path';
import cors from 'cors';

export const serverPrinciple: ServerPrinciple = ({ concepts_, k_, plan, nextA }) => {
  // C667 · S0b THE LOOPBACK BIND (site D · bridge state-sync server): /stateSync + /files
  // serve only the same-machine Electron client — no LAN consumer. Loopback-safe.
  const HOST = '127.0.0.1';
  const initialServerState = k_.getState(concepts_) as ServerState;
  const server = initialServerState.server;
  let newClientState: undefined | unknown = undefined;
  if (server) {
    server.use(cors());
    server.use('/files', express.static(path.join(__dirname, '../../../static')));

    setTimeout(() => {
      server.listen(initialServerState.port, HOST, () => {
        console.log(`Running on http://${HOST}:${initialServerState.port}}`);
        console.log(`Static files available at http://${HOST}:${initialServerState.port}/files`);
      });
    }, 1000);
    if (initialServerState.syncClientState) {
      const syncStatePlan = plan('sync state plan', ({ stageO, stage }) => [
        stageO(), // Waits for ownership initialization (auto-registers)
        stage(({ k }) => {
          newClientState = k.clientState.select();
        }),
      ]);
      server.get('/stateSync', (__, res) => {
        // console.log('HIT, newState: ', JSON.stringify(newState));
        res.json(newClientState);
      });
    }
    const reflectedServer = express();
    const reflectedPort = initialServerState.port + 1;
    reflectedServer.use(cors());
    reflectedServer.use('/files', express.static(path.join(__dirname, '../../../static')));

    initialServerState.servers.push({
      port: reflectedPort,
      server: reflectedServer,
    });
    setTimeout(() => {
      reflectedServer.listen(reflectedPort, HOST, () => {
        console.log(`Running on http://${HOST}:${reflectedPort}}`);
        console.log(`Static files available at http://${HOST}:${reflectedPort}/files`);
      });
    }, 1000);
    if (initialServerState.syncClientState) {
      reflectedServer.get('/stateSync', (__, res) => {
        // console.log('HIT, newState: ', JSON.stringify(newState));
        res.json(newClientState);
      });
    }
  }
};
/*#>*/
