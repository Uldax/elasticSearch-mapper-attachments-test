//Not tested yet
if( ctx._source."$fieldToUpdate".contains(new_group)) {
    ctx._source."$fieldToUpdate" -= new_group
}
else {
      ctx.op = "noop"
}