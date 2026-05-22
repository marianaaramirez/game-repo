/**
 * MapSystem.js
 * Generates branching maps for each world.
 * Each map is a directed graph of nodes. Node types: BATTLE, CHEST, BOSS.
 * The player starts at node 0 and must reach the BOSS node to clear the world.
 * Chest nodes are randomly assigned as REWARD or TRAP at generation time.
 *
 * World 1 (Ancient Temple) uses a hand-authored diamond/branching layout.
 * Worlds 2 and 3 use the procedural column-based generator.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

// Types of nodes that can appear on the map
const NODE_TYPES = {
  BATTLE: 'battle', // Standard enemy encounter
  CHEST:  'chest',  // Random reward or trap event
  BOSS:   'boss',   // Final boss of the world
};

// Types of chest events
const CHEST_TYPES = {
  REWARD: 'reward', // Gives a card or HP
  TRAP:   'trap',   // Triggers a surprise enemy or math challenge
};

/**
 * Picks a random chest subtype (reward or trap).
 * @returns {string}
 */
function randomChestType() {
  return Math.random() < 0.5 ? CHEST_TYPES.REWARD : CHEST_TYPES.TRAP;
}

/**
 * Hand-authored map for World 1 (Ancient Temple).
 * Nodes are arranged in a wide diamond/branching shape so the layout looks
 * clearly different from the procedural column grid used by worlds 2 and 3.
 *
 *   Layout (left to right):
 *     0 start ─┬─ 1 ─┬─ 3 ── 6 ─┐
 *              │     └─ 4 ─┬────┤
 *              └─ 2 ─┬─────┘    │
 *                    └─ 5 ── 7 ─┴─ 8 boss
 *
 * @returns {{ nodes: object[], currentNode: number, worldLevel: number }}
 */
function generateWorld1Map() {
  // [id, type, x, y, connections]
  const layout = [
    [0, NODE_TYPES.BATTLE,  90, 300, [1, 2]],
    [1, NODE_TYPES.BATTLE, 240, 160, [3, 4]],
    [2, NODE_TYPES.CHEST,  240, 440, [4, 5]],
    [3, NODE_TYPES.CHEST,  390, 110, [6]],
    [4, NODE_TYPES.BATTLE, 390, 300, [6, 7]],
    [5, NODE_TYPES.BATTLE, 390, 490, [7]],
    [6, NODE_TYPES.BATTLE, 550, 200, [8]],
    [7, NODE_TYPES.CHEST,  550, 400, [8]],
    [8, NODE_TYPES.BOSS,   710, 300, []],
  ];

  const nodes = layout.map(([id, type, x, y, connections]) => ({
    id,
    type,
    x,
    y,
    connections,
    // Chest nodes get a random subtype; other node types have none
    chestType: type === NODE_TYPES.CHEST ? randomChestType() : null,
    completed: false,
    worldLevel: 1,
  }));

  return { nodes, currentNode: 0, worldLevel: 1 };
}

/**
 * Procedurally generates a map for worlds 2 and 3.
 * Node count increases with world level. Nodes are laid out in columns;
 * each node connects forward to every node in the next column.
 *
 * @param {number} worldLevel - 2 or 3
 * @returns {{ nodes: object[], currentNode: number, worldLevel: number }}
 */
function generateProceduralMap(worldLevel) {
  const nodeCount = 5 + worldLevel; // World 2: 7 nodes, World 3: 8
  const nodes = [];

  // Node 0: always a battle, always the starting point
  nodes.push({
    id: 0,
    type: NODE_TYPES.BATTLE,
    x: 100,
    y: 300,
    connections: [1, 2], // Branches to two paths
    completed: false,
    worldLevel,
  });

  // Middle nodes: randomly battle (60%) or chest (40%)
  for (let i = 1; i < nodeCount - 1; i++) {
    const type = Math.random() < 0.6 ? NODE_TYPES.BATTLE : NODE_TYPES.CHEST;

    // Calculate grid position: 2 rows, columns advance every 2 nodes
    const col = Math.floor((i - 1) / 2) + 1;
    const row = (i - 1) % 2;
    const x = 100 + col * 120;
    const y = 200 + row * 200;

    // Connect this node to all nodes in the next column
    const connections = [];
    const nextCol = col + 1;
    for (let j = 1; j < nodeCount - 1; j++) {
      const jCol = Math.floor((j - 1) / 2) + 1;
      if (jCol === nextCol) {
        connections.push(j);
      }
    }
    // If no next column exists, connect directly to the boss
    if (connections.length === 0) {
      connections.push(nodeCount - 1);
    }

    nodes.push({
      id: i,
      type,
      chestType: type === NODE_TYPES.CHEST ? randomChestType() : null,
      x,
      y,
      connections,
      completed: false,
      worldLevel,
    });
  }

  // Last node: always the boss
  nodes.push({
    id: nodeCount - 1,
    type: NODE_TYPES.BOSS,
    x: 100 + Math.ceil((nodeCount - 2) / 2 + 1) * 120,
    y: 300,
    connections: [],
    completed: false,
    worldLevel,
  });

  return { nodes, currentNode: 0, worldLevel };
}

/**
 * Generates a new map for the given world level.
 * World 1 uses a fixed hand-authored layout; worlds 2 and 3 are procedural.
 * @param {number} worldLevel - 1, 2, or 3
 * @returns {{ nodes: object[], currentNode: number, worldLevel: number }}
 */
function generateMap(worldLevel = 1) {
  if (worldLevel === 1) {
    return generateWorld1Map();
  }
  return generateProceduralMap(worldLevel);
}

/**
 * Returns the list of nodes the player can navigate to from the current position.
 * @param {{ nodes: object[], currentNode: number }} map
 * @returns {object[]} Array of available node objects
 */
function getAvailableNodes(map) {
  const current = map.nodes[map.currentNode];
  if (!current) return [];
  return current.connections.map((id) => map.nodes[id]).filter(Boolean);
}

export default { generateMap, getAvailableNodes, NODE_TYPES, CHEST_TYPES };
