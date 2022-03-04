export const fetchContractFromSourcify = async (plugin, network, contractAddress, targetPath) => {
  let data
  const compilationTargets = {}

  try {
    data = await plugin.call('sourcify', 'fetchByNetwork', contractAddress, network.id)
  } catch (e) {
    console.log(e)
  }

  if (!data || !data.metadata) {
    return null
  }

  // set the solidity contract code using metadata
  await plugin.call('fileManager', 'setFile', `${targetPath}/${network.id}/${contractAddress}/metadata.json`, JSON.stringify(data.metadata, null, '\t'))
  for (let file in data.metadata.sources) {
    const urls = data.metadata.sources[file].urls
    for (const url of urls) {
      if (url.includes('ipfs')) {
        const stdUrl = `ipfs://${url.split('/')[2]}`
        const source = await plugin.call('contentImport', 'resolve', stdUrl)
        file = file.replace('browser/', '') // should be fixed in the remix IDE end.
        if (await plugin.call('contentImport', 'isExternalUrl', file)) {
          // nothing to do, the compiler callback will handle those
        } else {
          const path = `${targetPath}/${network.id}/${contractAddress}/${file}`
          await plugin.call('fileManager', 'setFile', path, source.content)
          compilationTargets[path] = { content: source.content }
        }
        break
      }
    }
  }
  const settings = {
    version: data.metadata.compiler.version,
    language: data.metadata.language,
    evmVersion: data.metadata.settings.evmVersion,
    optimize: data.metadata.settings.optimizer.enabled,
    runs: data.metadata.settings.optimizer.runs
  }
  return {
    settings,
    compilationTargets
  }
}
