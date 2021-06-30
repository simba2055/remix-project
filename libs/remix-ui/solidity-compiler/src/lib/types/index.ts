
export interface SolidityCompilerProps {
  plugin: {
    contractMap: {
      file: string
    } | Record<string, any>
    compileErrors: any,
    isHardHatProject: boolean,
    queryParams: any,
    compileTabLogic: any,
    currentFile: string,
    contractsDetails: Record<string, any>,
    editor: any,
    config: any,
    fileProvider: any,
    fileManager: any,
    contentImport: any,
    call: (...args) => void
    on: (...args) => void,
    setHardHatCompilation: (value: boolean) => void,
  },
}

export interface CompilerContainerProps {
  editor: any,
  config: any,
  queryParams: any,
  compileTabLogic: any,
  tooltip: (message: string) => void,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void) => void,
  compiledFileName: string,
  setHardHatCompilation: (value: boolean) => void,
  updateCurrentVersion: any,
  isHardHatProject: boolean
}
export interface ContractSelectionProps {
  contractMap: {
    file: string
  } | Record<string, any>,
  fileManager: any,
  fileProvider: any,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void) => void,
  contractsDetails: Record<string, any>
}
