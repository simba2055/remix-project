'use strict'
import { toBN } from './util'

export class RefType {
  location
  storageSlots
  storageBytes
  typeName
  basicType

  constructor (storageSlots, storageBytes, typeName, location) {
    this.location = location
    this.storageSlots = storageSlots
    this.storageBytes = storageBytes
    this.typeName = typeName
    this.basicType = 'RefType'
  }

  decodeFromStorage(input1? : any, input2? : any) {
    throw new Error('This method is abstract');
  }

  decodeFromMemoryInternal(input1? : any, input2? : any, input3?: any) {
    throw new Error('This method is abstract');
  }

  /**
    * decode the type from the stack
    *
    * @param {Int} stackDepth - position of the type in the stack
    * @param {Array} stack - stack
    * @param {String} - memory
    * @param {Object} - storageResolver
    * @return {Object} decoded value
    */
  async decodeFromStack (stackDepth, stack, memory, storageResolver, cursor): Promise<any> {
    if (stack.length - 1 < stackDepth) {
      return { error: '<decoding failed - stack underflow ' + stackDepth + '>', type: this.typeName }
    }
    let offset = stack[stack.length - 1 - stackDepth]
    if (this.isInStorage()) {
      offset = toBN(offset)
      try {
        return await this.decodeFromStorage({ offset: 0, slot: offset }, storageResolver)
      } catch (e) {
        console.log(e)
        return { error: '<decoding failed - ' + e.message + '>', type: this.typeName }
      }
    } else if (this.isInMemory()) {
      offset = parseInt(offset, 16)
      return this.decodeFromMemoryInternal(offset, memory, cursor)
    } else {
      return { error: '<decoding failed - no decoder for ' + this.location + '>', type: this.typeName }
    }
  }

  /**
    * decode the type from the memory
    *
    * @param {Int} offset - position of the ref of the type in memory
    * @param {String} memory - memory
    * @return {Object} decoded value
    */
  decodeFromMemory (offset, memory) {
    offset = memory.substr(2 * offset, 64)
    offset = parseInt(offset, 16)
    return this.decodeFromMemoryInternal(offset, memory)
  }

  /**
    * current type defined in storage
    *
    * @return {Bool} - return true if the type is defined in the storage
    */
  isInStorage () {
    return this.location.indexOf('storage') === 0
  }

  /**
    * current type defined in memory
    *
    * @return {Bool} - return true if the type is defined in the memory
    */
  isInMemory () {
    return this.location.indexOf('memory') === 0
  }
}
