const { LargeObjectManager } = require('pg-large-object');
const { createReadStream, createWriteStream } = require('fs');
const pgp = require('pg-promise')();

databaseConfig = require('./config.json')['database'];
const tablename = require('./config.json')['tablename'];

const db = pgp(databaseConfig);

async function storeOidFilename(filename, oid) {
    let client;
    try{
        client = await db.connect();
        console.log(`Writing oid ${oid} to the file ${filename}`);
        console.log("I'M HERE");
        await client.any('INSERT INTO ' + tablename + ' (oid, filename) VALUES (${oid}, ${filename});', {
            filename,
            oid
        });     
        return db_return;
    } catch(err){
        //Closing all connections at once
        //pgp.end();
        return err;
    }
}

async function getOidByFilename(filename) {
    let client;
    try{
        client = await db.connect();
        const oid = await client.one('SELECT oid FROM ' + tablename + ' WHERE filename = $1', filename);
        return oid['oid'];
    } catch(err){
        return err;
    }
}

module.exports = {

    async databaseWriter(filename) {
        //Checking if the data exists already
        const verifyData = await getOidByFilename(filename);
        if(!isNaN(verifyData)){
            throw new Error("The data already exists in the database.");
        }

        return db.tx(tx => {
            const man = new LargeObjectManager({ pgPromise: tx });
            const bufferSize = 2048;

            return man.createAndWritableStreamAsync(bufferSize)
                .then(([oid, stream]) => {
                    // The server has generated an oid
                    console.log('Creating a large object with the oid', oid);

                    const fileStream = createReadStream(filename);
                    fileStream.pipe(stream);

                    return new Promise((resolve, reject) => {

                        stream.on('finish', () => {
                            resolve(oid);
                        });
                        stream.on('error', reject);
                    });
                });
        }).then(async (oid) => {
            //Now we store the oid and the filename
            await storeOidFilename(filename, oid);
            return oid;
        });
    },

   async databaseReader(filename) {
        return db.tx(async tx => {
            const man = new LargeObjectManager({ pgPromise: tx });

            const oid = await getOidByFilename(filename);
            const bufferSize = 2048;
            
            return man.openAndReadableStreamAsync(oid, bufferSize)
                .then(([size, stream]) => {
                    console.log('Streaming a large object with a total size of', size);

                    const fileStream = createWriteStream(filename);
                    stream.pipe(fileStream);
                    
                    return new Promise((resolve, reject) => {
                        stream.on('end', () => {
                            resolve(size); 
                            }
                        );
                        stream.on('error', reject);
                    });
                });
        })
        .then((size) => {
            return size;
        })
        .catch(err => {
            return err;
        });
    }
}
