/**
 * scripts/writeBridgeRestartTrigger.ts — BRTF (Bridge Restart Trigger File) writer
 *
 * Invoked by `nodemon.dev.json` exec on any change in `src/`. Writes
 * `.bridge-restart.json` into the template SCP root. The template's
 * own `nodemon.json` watches that exact file and restarts its ts-node
 * bridge process — completing the cascading Nodemon Pair without any
 * modification to template-side machinery.
 *
 * Path target verified against: Cascades/scps/template/SCP/nodemon.json
 *   "watch": [".bridge-restart.json"]
 *
 * Citation: SCS-DEV-SCRIPT-WAVE2-OCHRE-DEVSCRIPT-BLUEPRINT.md Section 5
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SCPS_JSON_PATH = resolve(process.cwd(), 'Cascades', 'SCPs.json');
const FALLBACK_BRTF_PATH = resolve(
  process.cwd(),
  'Cascades/scps/template/SCP/.bridge-restart.json',
);

// Template Citizenship (BO-2-C · Edit 3.1): resolve the BRTF target from the
// SCPs.json registry's 'template' entry when the template is a standard citizen.
// Falls back to the hardcoded path when the registry has no entry or on any
// parse/IO error — zero regression for pre-citizenship dev:self.
function resolveTemplateBrtfPath(): string {
  try {
    if (existsSync(SCPS_JSON_PATH)) {
      const registry = JSON.parse(readFileSync(SCPS_JSON_PATH, 'utf8')) as {
        scps?: Array<{ name: string; path: string }>;
      };
      const templateEntry = (registry.scps ?? []).find((s) => s.name === 'template');
      if (templateEntry?.path) {
        return resolve(process.cwd(), templateEntry.path, '.bridge-restart.json');
      }
    }
  } catch {
    // fallback
  }
  return FALLBACK_BRTF_PATH;
}

function main(): void {
  const brtfPath = resolveTemplateBrtfPath();
  mkdirSync(dirname(brtfPath), { recursive: true });
  writeFileSync(
    brtfPath,
    JSON.stringify(
      {
        restartedAt: new Date().toISOString(),
        source: 'scs-self-dev-watcher',
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  process.stdout.write('[SCS] BRTF written — template bridge will restart\n');
}

main();
