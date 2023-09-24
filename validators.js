import { parse } from 'date-fns'

export const validateDate = (dateString) => {
  return !isNaN(parse(dateString, 'yyyy-MM-dd', new Date()))
}

export const validateBody = (request) => {
  const { apelido, nome, nascimento, stack } = request.body

  if (typeof apelido !== 'string' || apelido.length > 32) {
    return false
  }

  if (typeof nome !== 'string' || nome.length > 100) {
    return false
  }

  if (typeof nascimento !== 'string' || !validateDate(nascimento)) {
    return false
  }

  if (stack) {
    if (!Array.isArray(stack)) {
      return false
    }
    const arrayWithError = stack.findIndex(
      (value) => typeof value !== 'string' || value.length > 32
    )
    if (arrayWithError >= 0) {
      return false
    }
  }

  return true
}
