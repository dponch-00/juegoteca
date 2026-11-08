/// <reference lib="webworker" />
import { chooseSequence, getBgLevel } from './ai'
import { position, seqToString } from './logic'

/** Pide: { id, moves, level } (con los dados ya tirados) → responde: { id, move: "m:…" } */
self.onmessage = (e: MessageEvent<{ id: number; moves: string[]; level: number }>) => {
  const { id, moves, level } = e.data
  try {
    const pos = position({ moves })
    if (!pos.dice) throw new Error('Faltan los dados')
    postMessage({ id, move: seqToString(chooseSequence(pos, getBgLevel(level))) })
  } catch (err) {
    postMessage({ id, move: null, error: String(err) })
  }
}
