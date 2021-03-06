// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of ThingTalk
//
// Copyright 2018 The Board of Trustees of the Leland Stanford Junior University
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const ThingTalk = require('..');

process.on('unhandledRejection', (up) => { throw up; });

function readall(stream) {
    return new Promise((resolve, reject) => {
        const buffers = [];
        let total = 0;
        stream.on('data', (buf) => {
            buffers.push(buf);
            total += buf.length;
        });
        stream.on('end', () => {
            resolve(Buffer.concat(buffers, total));
        });
        stream.on('error', reject);
    });
}

async function main() {
    const toJSON = process.argv[2] === '--tojson';
    if (!toJSON && process.argv[2] !== undefined &&
        process.argv[2] !== '--fromjson') {
        console.error(`Usage: ${process.argv[1]} [--tojson | --fromjson] kind`);
        process.exit(1);
    }

    const buffer = await readall(process.stdin);

    if (toJSON) {
        const parsed = ThingTalk.Grammar.parse(buffer.toString());
        const json = ThingTalk.Ast.toManifest(parsed);
        console.log(JSON.stringify(json, undefined, 2));
    } else {
        const json = JSON.parse(buffer);
        if (!json.types)
            json.types = [];
        if (!json.child_types)
            json.child_types = [];
        if (!json.category)
            json.category = 'data';
        if (!json.subcategory)
            json.subcategory = '';
        if (!json.params)
            json.params = {};
        if (!json.queries)
            json.queries = {};
        if (!json.actions)
            json.actions = {};
        for (let name in json.queries) {
            if (!json.queries[name].formatted)
                json.queries[name].formatted = [];
        }

        const program = ThingTalk.Ast.fromManifest(process.argv[3], json);
        console.log(program.prettyprint());
    }
}
main();
