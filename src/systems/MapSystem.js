/**
 * MapSystem.js
 * Generates procedural branching maps for each world.
 * Each map is a directed graph of nodes. Node types: BATTLE, CHEST, BOSS.
 * The player starts at node 0 and must reach the BOSS node to clear the world.
 * Chest nodes are randomly assigned as REWARD or TRAP at generation time.
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
 * Generates a new map for the given world level.
 * Node count increases with world level to add more encounters.
 * Nodes are laid out in columns; each node connects forward to the next column.
 *
 * {number} worldLevel - 1, 2, or 3
 * returns {{ nodes: object[], currentNode: number, worldLevel: number }}
 */
function generateMap(worldLevel = 1) {
  const nodeCount = 5 + worldLevel; // World 1: 6 nodes, World 2: 7, World 3: 8
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
    const roll = Math.random();
    let type;
    if (roll < 0.6) {
      type = NODE_TYPES.BATTLE;
    } else {
      type = NODE_TYPES.CHEST;
    }

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
    // If no next column exists, connect directly to boss
    if (connections.length === 0) {
      connections.push(nodeCount - 1);
    }

    nodes.push({
      id: i,
      type,
      // Chest nodes get a random subtype (reward or trap)
      chestType: type === NODE_TYPES.CHEST
        ? (Math.random() < 0.5 ? CHEST_TYPES.REWARD : CHEST_TYPES.TRAP)
        : null,
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
    connections: [], // No connections after boss
    completed: false,
    worldLevel,
  });

  return { nodes, currentNode: 0, worldLevel };
}

/**
 * Returns the list of nodes the player can navigate to from the current position.
 * {{ nodes: object[], currentNode: number }} map
 * returns {object[]} Array of available node objects
 */
function getAvailableNodes(map) {
  const current = map.nodes[map.currentNode];
  if (!current) return [];
  return current.connections.map((id) => map.nodes[id]).filter(Boolean);
}

export default { generateMap, getAvailableNodes, NODE_TYPES, CHEST_TYPES };
