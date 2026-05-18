const NODE_TYPES = {
  BATTLE: 'battle',
  CHEST: 'chest',
  BOSS: 'boss',
};

const CHEST_TYPES = {
  REWARD: 'reward',
  TRAP: 'trap',
};

function generateMap(worldLevel = 1) {
  const nodeCount = 5 + worldLevel;
  const nodes = [];

  nodes.push({
    id: 0,
    type: NODE_TYPES.BATTLE,
    x: 100,
    y: 300,
    connections: [1, 2],
    completed: false,
    worldLevel,
  });

  for (let i = 1; i < nodeCount - 1; i++) {
    const roll = Math.random();
    let type;
    if (roll < 0.6) {
      type = NODE_TYPES.BATTLE;
    } else {
      type = NODE_TYPES.CHEST;
    }

    const col = Math.floor((i - 1) / 2) + 1;
    const row = (i - 1) % 2;
    const x = 100 + col * 120;
    const y = 200 + row * 200;

    const connections = [];
    const nextCol = col + 1;
    for (let j = 1; j < nodeCount - 1; j++) {
      const jCol = Math.floor((j - 1) / 2) + 1;
      if (jCol === nextCol) {
        connections.push(j);
      }
    }
    if (connections.length === 0) {
      connections.push(nodeCount - 1);
    }

    nodes.push({
      id: i,
      type,
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

function getAvailableNodes(map) {
  const current = map.nodes[map.currentNode];
  if (!current) return [];
  return current.connections.map((id) => map.nodes[id]).filter(Boolean);
}

export default { generateMap, getAvailableNodes, NODE_TYPES, CHEST_TYPES };
