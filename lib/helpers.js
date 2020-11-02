function respondToError(res, err, message = undefined) {
    res.status(determineErrorCode(err));
    err.http_status = undefined;
    res.send({message, err});
}

function determineErrorCode(err) {
    if(err.http_status !== undefined) {
        return err.http_status; // Status was already set => return this status
    }
    if(err.name === 'ValidationError') {
        return 422; // Semantically wrong data for which DB validation failed => 422 Unprocessable Entity
    }
    if(err.name === 'CastError' &&
        (err.kind === 'ObjectId' || err.kind=== 'date')) {
        return 400; // Syntactically wrong ObjectId or date => 400 Bad Request
    }
    // None of the above cases => 500 Internal server error
    console.log("determineErrorCode: Unknown error type: error name \"" + err.name + "\", message \"" + err.message + "\"");
    return 500;
}

function isNearlyEqual(num1, num2) {
    const epsilon = 1.192092896e-07
    return Math.abs(num1 - num2) < epsilon
}

module.exports = {respondToError, isNearlyEqual};
