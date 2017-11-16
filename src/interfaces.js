export class IReadContext {
    retrieveWhere(condition) {}
}

export class IWriteContext extends IReadContext {
    createObject(record) {}
}

export class IDataStore {
    // IReadContext => Any
    read(fReader) {}

    // IWriteContext => Any
    write(fWriter) {}
}
