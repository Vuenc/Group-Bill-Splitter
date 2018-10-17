function respondToError(res, err, message = undefined) {
    res.status(determineErrorCode(err));
    err.http_status = undefined;
    res.send({message, err});
}

function determineErrorCode(err) {
    if(err.http_status !== undefined) {
        return err.http_status;
    }
    if(err.name === 'ValidationError') {
        return 422;
    }
    console.log("Unknown error type: error name \"" + err.name + "\", message \"" + err.message + "\"");
    return 500;
}

module.exports = {respondToError}