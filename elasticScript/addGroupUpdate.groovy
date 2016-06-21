//Not tested yet
if( ctx._source."$fieldToUpdate".contains(new_group)) {
    ctx.op = "noop"
}
else {
    ctx._source."$fieldToUpdate" += new_group
}