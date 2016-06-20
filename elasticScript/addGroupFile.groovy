//Not tested yet
if(new_group in ctx._source.document_groups_ids) {
    ctx.op = "noop"
}
else {
    ctx._source.document_groups_ids+=new_group
}
