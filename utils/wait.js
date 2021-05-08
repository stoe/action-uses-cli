const wait = milliseconds => {
  return new Promise(resolve => {
    if (typeof milliseconds !== 'number') {
      throw new Error('milliseconds not a number')
    }

    setTimeout(() => resolve('done!'), milliseconds)
  })
}

export default wait
