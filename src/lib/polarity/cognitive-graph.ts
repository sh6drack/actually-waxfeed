/**
 * Polarity OS - Cognitive Graph
 *
 * Graph-based cognitive modeling for music taste analysis.
 * Ported from Polarity OS Python implementation.
 */

// Node types for the cognitive graph
export const NODE_TYPES = {
  USER: 'user',
  PATTERN: 'pattern',
  BASELINE: 'baseline',
  EPISODE: 'episode',
  MESSAGE: 'message',
  DRIFT_ALERT: 'drift_alert',
  SNAPSHOT: 'snapshot',
  GENRE: 'genre',
  ARTIST: 'artist',
  ALBUM: 'album',
  REVIEW: 'review',
  ARCHETYPE: 'archetype',
  NETWORK: 'network',
  FUTURE_SELF: 'future_self',
} as const

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES]

// Edge types for relationships
export const EDGE_TYPES = {
  EXHIBITED_IN: 'exhibited_in',
  PREDICTS: 'predicts',
  REINFORCES: 'reinforces',
  CONTRADICTS: 'contradicts',
  SIMILAR_TO: 'similar_to',
  EVOLVED_FROM: 'evolved_from',
  ACTIVATES: 'activates',
  BELONGS_TO: 'belongs_to',
  RATED: 'rated',
  DETECTED_FROM: 'detected_from',
  LEADS_TO: 'leads_to',
  STRENGTHENS: 'strengthens',
  FADES: 'fades',
} as const

export type EdgeType = typeof EDGE_TYPES[keyof typeof EDGE_TYPES]

// Pattern status lifecycle
export type PatternStatus = 'emerging' | 'confirmed' | 'fading' | 'dormant'

// Core node structure
export interface CognitiveNode {
  id: string
  type: NodeType
  data: Record<string, unknown>
  weight: number
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

// Core edge structure
export interface CognitiveEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number
  createdAt: Date
  metadata?: Record<string, unknown>
}

// Graph importance scores
export interface ImportanceScores {
  pageRank: number
  hubScore: number
  authorityScore: number
  betweenness: number
  recencyWeight: number
  combined: number
}

/**
 * CognitiveGraph - Graph-based cognitive modeling
 *
 * Implements PageRank, HITS, and centrality scoring for nodes.
 */
export class CognitiveGraph {
  private nodes: Map<string, CognitiveNode>
  private edges: Map<string, CognitiveEdge>
  private adjacencyList: Map<string, Set<string>>
  private reverseAdjacencyList: Map<string, Set<string>>

  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
    this.adjacencyList = new Map()
    this.reverseAdjacencyList = new Map()
  }

  // Add a node to the graph
  addNode(node: Omit<CognitiveNode, 'createdAt' | 'updatedAt'>): CognitiveNode {
    const fullNode: CognitiveNode = {
      ...node,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.nodes.set(node.id, fullNode)
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set())
    }
    if (!this.reverseAdjacencyList.has(node.id)) {
      this.reverseAdjacencyList.set(node.id, new Set())
    }
    return fullNode
  }

  // Add an edge to the graph
  addEdge(edge: Omit<CognitiveEdge, 'id' | 'createdAt'>): CognitiveEdge {
    const id = `${edge.source}-${edge.type}-${edge.target}`
    const fullEdge: CognitiveEdge = {
      ...edge,
      id,
      createdAt: new Date(),
    }
    this.edges.set(id, fullEdge)

    // Update adjacency lists
    if (!this.adjacencyList.has(edge.source)) {
      this.adjacencyList.set(edge.source, new Set())
    }
    this.adjacencyList.get(edge.source)!.add(edge.target)

    if (!this.reverseAdjacencyList.has(edge.target)) {
      this.reverseAdjacencyList.set(edge.target, new Set())
    }
    this.reverseAdjacencyList.get(edge.target)!.add(edge.source)

    return fullEdge
  }

  // Get a node by ID
  getNode(id: string): CognitiveNode | undefined {
    return this.nodes.get(id)
  }

  // Get all nodes of a type
  getNodesByType(type: NodeType): CognitiveNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type)
  }

  // Get neighbors of a node
  getNeighbors(nodeId: string): string[] {
    return Array.from(this.adjacencyList.get(nodeId) || [])
  }

  // Get incoming neighbors
  getIncomingNeighbors(nodeId: string): string[] {
    return Array.from(this.reverseAdjacencyList.get(nodeId) || [])
  }

  // Get edges from a node
  getEdgesFrom(nodeId: string): CognitiveEdge[] {
    return Array.from(this.edges.values()).filter(e => e.source === nodeId)
  }

  // Get edges to a node
  getEdgesTo(nodeId: string): CognitiveEdge[] {
    return Array.from(this.edges.values()).filter(e => e.target === nodeId)
  }

  /**
   * Compute PageRank scores for all nodes
   *
   * @param dampingFactor - Probability of following a link (default 0.85)
   * @param iterations - Number of iterations (default 20)
   */
  computePageRank(dampingFactor = 0.85, iterations = 20): Map<string, number> {
    const n = this.nodes.size
    if (n === 0) return new Map()

    const nodeIds = Array.from(this.nodes.keys())
    const scores = new Map<string, number>()

    // Initialize with uniform distribution
    nodeIds.forEach(id => scores.set(id, 1 / n))

    for (let i = 0; i < iterations; i++) {
      const newScores = new Map<string, number>()

      nodeIds.forEach(id => {
        let rank = (1 - dampingFactor) / n

        const incomingNeighbors = this.getIncomingNeighbors(id)
        incomingNeighbors.forEach(neighbor => {
          const outDegree = this.getNeighbors(neighbor).length
          if (outDegree > 0) {
            rank += dampingFactor * (scores.get(neighbor) || 0) / outDegree
          }
        })

        newScores.set(id, rank)
      })

      scores.clear()
      newScores.forEach((v, k) => scores.set(k, v))
    }

    return scores
  }

  /**
   * Compute HITS (Hub and Authority) scores
   *
   * Hubs point to many authorities, authorities are pointed to by many hubs
   */
  computeHITS(iterations = 20): { hubs: Map<string, number>; authorities: Map<string, number> } {
    const nodeIds = Array.from(this.nodes.keys())
    const hubs = new Map<string, number>()
    const authorities = new Map<string, number>()

    // Initialize
    nodeIds.forEach(id => {
      hubs.set(id, 1)
      authorities.set(id, 1)
    })

    for (let i = 0; i < iterations; i++) {
      // Update authority scores
      nodeIds.forEach(id => {
        let authScore = 0
        const incoming = this.getIncomingNeighbors(id)
        incoming.forEach(neighbor => {
          authScore += hubs.get(neighbor) || 0
        })
        authorities.set(id, authScore)
      })

      // Update hub scores
      nodeIds.forEach(id => {
        let hubScore = 0
        const outgoing = this.getNeighbors(id)
        outgoing.forEach(neighbor => {
          hubScore += authorities.get(neighbor) || 0
        })
        hubs.set(id, hubScore)
      })

      // Normalize
      const hubNorm = Math.sqrt(Array.from(hubs.values()).reduce((a, b) => a + b * b, 0)) || 1
      const authNorm = Math.sqrt(Array.from(authorities.values()).reduce((a, b) => a + b * b, 0)) || 1

      nodeIds.forEach(id => {
        hubs.set(id, (hubs.get(id) || 0) / hubNorm)
        authorities.set(id, (authorities.get(id) || 0) / authNorm)
      })
    }

    return { hubs, authorities }
  }

  /**
   * Compute betweenness centrality
   *
   * Nodes that lie on many shortest paths have high betweenness
   */
  computeBetweenness(): Map<string, number> {
    const nodeIds = Array.from(this.nodes.keys())
    const betweenness = new Map<string, number>()
    nodeIds.forEach(id => betweenness.set(id, 0))

    // For each node, compute shortest paths
    nodeIds.forEach(source => {
      const distances = new Map<string, number>()
      const paths = new Map<string, number>()
      const predecessors = new Map<string, string[]>()
      const stack: string[] = []

      // BFS
      const queue: string[] = [source]
      distances.set(source, 0)
      paths.set(source, 1)

      while (queue.length > 0) {
        const v = queue.shift()!
        stack.push(v)

        const neighbors = this.getNeighbors(v)
        neighbors.forEach(w => {
          if (!distances.has(w)) {
            distances.set(w, (distances.get(v) || 0) + 1)
            queue.push(w)
          }
          if (distances.get(w) === (distances.get(v) || 0) + 1) {
            paths.set(w, (paths.get(w) || 0) + (paths.get(v) || 0))
            if (!predecessors.has(w)) predecessors.set(w, [])
            predecessors.get(w)!.push(v)
          }
        })
      }

      // Accumulate
      const delta = new Map<string, number>()
      nodeIds.forEach(id => delta.set(id, 0))

      while (stack.length > 0) {
        const w = stack.pop()!
        const preds = predecessors.get(w) || []
        preds.forEach(v => {
          const contribution = ((paths.get(v) || 0) / (paths.get(w) || 1)) * (1 + (delta.get(w) || 0))
          delta.set(v, (delta.get(v) || 0) + contribution)
        })
        if (w !== source) {
          betweenness.set(w, (betweenness.get(w) || 0) + (delta.get(w) || 0))
        }
      }
    })

    // Normalize
    const n = nodeIds.length
    if (n > 2) {
      const factor = 1 / ((n - 1) * (n - 2))
      nodeIds.forEach(id => {
        betweenness.set(id, (betweenness.get(id) || 0) * factor)
      })
    }

    return betweenness
  }

  /**
   * Compute combined importance scores for all nodes
   */
  computeImportanceScores(): Map<string, ImportanceScores> {
    const pageRank = this.computePageRank()
    const { hubs, authorities } = this.computeHITS()
    const betweenness = this.computeBetweenness()

    const now = Date.now()
    const DAY_MS = 86400000

    const scores = new Map<string, ImportanceScores>()

    this.nodes.forEach((node, id) => {
      // Recency weight: exponential decay over 30 days
      const ageMs = now - node.updatedAt.getTime()
      const ageDays = ageMs / DAY_MS
      const recencyWeight = Math.exp(-ageDays / 30)

      const pr = pageRank.get(id) || 0
      const hub = hubs.get(id) || 0
      const auth = authorities.get(id) || 0
      const between = betweenness.get(id) || 0

      // Combined score with weights
      const combined = (
        pr * 0.3 +
        auth * 0.25 +
        hub * 0.15 +
        between * 0.15 +
        recencyWeight * 0.15
      )

      scores.set(id, {
        pageRank: pr,
        hubScore: hub,
        authorityScore: auth,
        betweenness: between,
        recencyWeight,
        combined,
      })
    })

    return scores
  }

  // Serialize graph to JSON
  toJSON(): { nodes: CognitiveNode[]; edges: CognitiveEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    }
  }

  // Load graph from JSON
  static fromJSON(data: { nodes: CognitiveNode[]; edges: CognitiveEdge[] }): CognitiveGraph {
    const graph = new CognitiveGraph()

    data.nodes.forEach(node => {
      graph.nodes.set(node.id, {
        ...node,
        createdAt: new Date(node.createdAt),
        updatedAt: new Date(node.updatedAt),
      })
      graph.adjacencyList.set(node.id, new Set())
      graph.reverseAdjacencyList.set(node.id, new Set())
    })

    data.edges.forEach(edge => {
      graph.edges.set(edge.id, {
        ...edge,
        createdAt: new Date(edge.createdAt),
      })
      graph.adjacencyList.get(edge.source)?.add(edge.target)
      graph.reverseAdjacencyList.get(edge.target)?.add(edge.source)
    })

    return graph
  }

  // Get graph statistics
  getStats(): {
    nodeCount: number
    edgeCount: number
    nodesByType: Record<string, number>
    avgDegree: number
    density: number
  } {
    const nodeCount = this.nodes.size
    const edgeCount = this.edges.size

    const nodesByType: Record<string, number> = {}
    this.nodes.forEach(node => {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1
    })

    const avgDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0
    const maxEdges = nodeCount * (nodeCount - 1)
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0

    return { nodeCount, edgeCount, nodesByType, avgDegree, density }
  }
}

