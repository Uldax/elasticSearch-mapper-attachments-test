if(ctx._source."$fieldToUpdate" == fieldValue) {
      ctx.op = "noop"
} else {
    ctx._source."$fieldToUpdate" = fieldValue
}

