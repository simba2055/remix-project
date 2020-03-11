'use strict'

import { FunctionHLAst, ContractHLAst, FunctionCallGraph, ContractCallGraph } from "types"
import { isLocalCallGraphRelevantNode,  isExternalDirectCall, getFullQualifiedFunctionCallIdent, getFullQuallyfiedFuncDefinitionIdent, getContractName } from './staticAnalysisCommon'

function buildLocalFuncCallGraphInternal (functions: FunctionHLAst[], nodeFilter: any , extractNodeIdent: any, extractFuncDefIdent: Function): Record<string, FunctionCallGraph> {
  const callGraph: Record<string, FunctionCallGraph> = {}
  functions.forEach((func) => {
    const calls = func.relevantNodes
      .filter(nodeFilter)
      .map(extractNodeIdent)
      .filter((name) => name !== extractFuncDefIdent(func)) // filter self recursive call

    callGraph[extractFuncDefIdent(func)] = { node: func, calls: calls }
  })
  return callGraph
}

/**
 * Builds a function call graph for the current contracts.
 * Example Contract call graph:
 *
 * {
 *  "KingOfTheEtherThrone": {
 *    "contracts": {...},                                        // Contract node as defined in abstractAstView.js
 *    "functions": {
 *      "KingOfTheEtherThrone.claimThrone(string memory)": {    // function in KingOfEtherThrone
 *        "node": {...},                                        // function node as defined in abstractAstView.js
 *        "calls": {                                            // list of full qualified function names which are called form this function
 *        }
 *      }
 *    }
 *  },
 *  "foo": {
 *    "contract": {...},           // Contract node as definded in abstractAstView.js
 *    "functions": {}             // map from full qualified function name to func node
 *  }
 * }
 *
 * @contracts {list contracts} Expects as input the contract structure defined in abstractAstView.js
 * @return {map (string -> Contract Call Graph)} returns map from contract name to contract call graph
 */
export function buildGlobalFuncCallGraph (contracts: ContractHLAst[]): Record<string, ContractCallGraph> {
  const callGraph: Record<string, ContractCallGraph> = {}
  contracts.forEach((contract) => {
    const filterNodes: Function = (node) => { return isLocalCallGraphRelevantNode(node) || isExternalDirectCall(node) }
    const getNodeIdent: Function = (node) => { return getFullQualifiedFunctionCallIdent(contract.node, node) }
    const getFunDefIdent: Function = (funcDef) => { return getFullQuallyfiedFuncDefinitionIdent(contract.node, funcDef.node, funcDef.parameters) }

    callGraph[getContractName(contract.node)] = { contract: contract, functions: buildLocalFuncCallGraphInternal(contract.functions, filterNodes, getNodeIdent, getFunDefIdent) }
  })

  return callGraph
}

/**
 * Walks through the call graph from a defined starting function, true if nodeCheck holds for every relevant node in the callgraph
 * @callGraph {callGraph} As returned by buildGlobalFuncCallGraph
 * @funcName {string} full qualified name of the starting function
 * @context {Object} provides additional context information that can be used by the nodeCheck function
 * @nodeCheck {(ASTNode, context) -> bool} applied on every relevant node in the call graph
 * @return {bool} returns map from contract name to contract call graph
 */
export function analyseCallGraph (callGraph: Record<string, ContractCallGraph>, funcName: string, context: object, nodeCheck): boolean {
  return analyseCallGraphInternal(callGraph, funcName, context, (a, b) => a || b, nodeCheck, {})
}

function analyseCallGraphInternal (callGraph: Record<string, ContractCallGraph>, funcName: string, context: object, combinator: Function, nodeCheck, visited : object): boolean {
  const current: FunctionCallGraph | undefined = resolveCallGraphSymbol(callGraph, funcName)

  if (current === undefined || visited[funcName] === true) return true
  visited[funcName] = true

  return combinator(current.node.relevantNodes.reduce((acc, val) => combinator(acc, nodeCheck(val, context)), false),
                        current.calls.reduce((acc, val) => combinator(acc, analyseCallGraphInternal(callGraph, val, context, combinator, nodeCheck, visited)), false))
}

export function resolveCallGraphSymbol (callGraph: Record<string, ContractCallGraph>, funcName: string): FunctionCallGraph | undefined {
  return resolveCallGraphSymbolInternal(callGraph, funcName, false)
}

function resolveCallGraphSymbolInternal (callGraph: Record<string, ContractCallGraph>, funcName: string, silent: boolean): FunctionCallGraph | undefined {
  let current: FunctionCallGraph | null = null
  if (funcName.includes('.')) {
    const parts = funcName.split('.')
    const contractPart = parts[0]
    const functionPart = parts[1]
    const currentContract: ContractCallGraph = callGraph[contractPart]
    if (!(currentContract === undefined)) {
      current = currentContract.functions[funcName]
       // resolve inheritance hierarchy
      if (current === undefined) {
        // resolve inheritance lookup in linearized fashion
        const inheritsFromNames: string[] = currentContract.contract.inheritsFrom.reverse()
        for (let i = 0; i < inheritsFromNames.length; i++) {
          const res = resolveCallGraphSymbolInternal(callGraph, inheritsFromNames[i] + '.' + functionPart, true)
          if (!(res === undefined)) return res
        }
      }
    } else {
      if (!silent) console.log(`static analysis functionCallGraph.js: Contract ${contractPart} not found in function call graph.`)
    }
  } else {
    throw new Error('functionCallGraph.js: function does not have full qualified name.')
  }
  if (current === undefined && !silent) console.log(`static analysis functionCallGraph.js: ${funcName} not found in function call graph.`)
  if(current !== null)
    return current
}
