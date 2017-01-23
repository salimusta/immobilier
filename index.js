import express from 'express';

const  pg = require('pg');
const leboncoin = require('leboncoin-api');
const sql = require('sql-query');
const sqlQuery = sql.Query();

const app = express();

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


let activeThreads = 0;

let nbEntriesAdded = 0;
let nbEntriesSkipped = 0;
let nbEntriesUpdated = 0;

var config = {
  user: 'postgres',
  database: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
};

const pool = new pg.Pool(config);

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})

let currentPage = 1;
let dbData;

RetrieveLocations();

const RECURRENT_SEARCH = true;
const MAX_THREAD = 30;
const DEEP_FETCH = true;


function AddHistory(client, adId, field, newValue) {
  var sqlInsert = sqlQuery.insert();
  const data = {
    id: adId,
    field: field,
    newvalue: newValue,
    modificationdate: new Date()
  };

  const requete = sqlInsert.into('history').set(data).build().replaceAll("`", "");
  console.log(requete)
  client.query(requete, function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
  });
}

function UpdateEntry(client, ad) {
  console.log("Update Entry ", ad.id)
  var sqlUpdate = sqlQuery.update()
  const data = {
    title: escape(ad.title),
    category: ad.category,
    link: ad.link,
    image: ad.images[0],
    urgent: ad.urgent,
    price: ad.price,
    date: ad.date,
    location: escape(ad.location)
  };

  const requete = sqlUpdate.into('immobilier').set(data).where({ id: ad.id }).build().replaceAll("`", "");
  console.log(requete)
  client.query(requete, function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
  });
}

function AddEntry(client, ad) {
  //console.log("Add Entry ", ad.id, ++nbEntriesAdded)
  var sqlInsert = sqlQuery.insert();
  const data = {
    id: ad.id,
    title: escape(ad.title),
    category: ad.category,
    link: ad.link,
    urgent: ad.urgent,
    price: !isNaN(ad.price) ? ad.price : 0,
    date: ad.date,
    location: escape(ad.location),
    category: ad.category,
    seller: ad.seller,
    rent: ad.rent,
    zip: ad.zip,
    city: ad.city,
    type: ad['type de bien'],
    rooms: ad.rooms,
    furnished: ad['meublé / non meublé'] === 'Meublé',
    surface: ad.surface,
    ges: ad.ges,
    classe: ad['classe énergie'],
    description: escape(ad.description)

  };

  const requete = sqlInsert.into('immobilier').set(data).build().replaceAll("`", "");
  client.query(requete, function(err, result) {
    if(err) {
    	console.log("REQUETE: ", requete);
      return console.error('error running query', err);
    }
  });
}

function onDataReceived(data) {
  const nbTotal = data.nbResult;
  const pageTotal = data.results.length;
  activeThreads--;
    //console.log(data.page); // the current page
    //console.log(data.nbResult); // the number of results for this search
    //console.log(data.nbResult[0])
    //console.log(data.results); // the array of results

    /*
    data.results[0].getPhoneNumber().then(function (phoneNumer) {
        console.log(phoneNumer); // the phone number of the author if available
    }, function (err) {
        console.error(err); // if the phone number is not available or not parsable (image -> string)
    });
    */
    const nbPage = nbTotal / pageTotal;
    const avancement = Math.round((currentPage / nbPage) * 100);
    console.log("Content received ", nbTotal, pageTotal, nbEntriesAdded, "---"+avancement+"%")
    console.log("Active Thread :" + activeThreads + "/" + MAX_THREAD)


    pool.connect(function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      const data2 = data;
      //Loop Here
      let i
      for (i in data2.results) {
        let ad = data2.results[i];
        if (DEEP_FETCH) {
          data2.results[i].getDetails().then(function (details) {
              //console.log("Details Received for ", ad.id)
              ad = details
              //Check if the entry alreafy exists
              const storedAd = dbData[ad.id];
              if(storedAd) {
                //compare both and add a new modif if necessary
                let changed = false;
                if (storedAd.price !== ad.price) {
                  AddHistory(client, ad.id, 'price', ad.price);
                  changed = true;
                }
                if (changed) {
                  UpdateEntry(ad)
                }
              }
              if (!storedAd) {
                AddEntry(client, ad);
              }

          }, function (err) {
              console.error(err);
          });
        }
        console.log("Getting Details for ", ad.id)


      }
      done();
    });

    if(pageTotal == 35 && RECURRENT_SEARCH) {
      while(activeThreads < MAX_THREAD && currentPage < nbPage) {
        activeThreads++;
        SearchLocations(++currentPage)
      }
    } else {
      console.log("FETCH DONE")
    }

}

function SearchLocations(currentPage) {
  const search = new leboncoin.Search().setCategory("ventes_immobilieres").setRegion("ile_de_france").setPage(currentPage);


  console.log("Fetching content: Locations Particulier, Page ", currentPage)

  search.run().then(onDataReceived, function (err) {
      console.error(err);
  });
}

function RetrieveLocations() {
  console.log("RetrieveLocations")
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    var sqlSelect = sqlQuery.select();
    var requete = sqlSelect.from('immobilier').build().replaceAll("`", "");
    client.query(requete, function(err, result) {
      console.log("Database Returned ", result.rows.length, " rows")
      let tab = {};
      for(var j = 0; j < result.rows.length; j++) {
        tab[result.rows[j].id] = result.rows[j];
      }
      console.log("Data compiled!")
      dbData = tab;
    });
    done();
    activeThreads++;
    SearchLocations(currentPage)
  });

}
