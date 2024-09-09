// Because this isn't a package (just a loose js file), we have to use require
// statements

const process = require("node:process")
const fs = require('node:fs');
const path = require('node:path');
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers")

function* GetLocalizationObjects() {
    const localeFolder = './src/localization';
    const folders = fs.readdirSync(localeFolder, { withFileTypes: true }).filter(file => file.isDirectory());
    for (const folder of folders) {
        const filePath = path.join(localeFolder, folder.name, "en.json");
        const jsonStr = fs.readFileSync(filePath);
        yield [filePath, JSON.parse(jsonStr)];
    }
}

const AddLocalizationKey = (key, value) => {
    const objects = key.split('.');

    for (const [localePath, localeObj] of GetLocalizationObjects()) {
        let currentObj = localeObj;
        let i = 0;
        // Last element is final key not object so loop n - 1 times
        for (i = 0; i < objects.length - 1; i++) {
            if (!(objects[i] in currentObj)) {
                currentObj[objects[i]] = {};
            }

            currentObj = currentObj[objects[i]];
        }
        currentObj[objects[i]] = value;
        fs.writeFileSync(localePath, `${JSON.stringify(localeObj, null, 4)}\n`);
    }

    console.log(`\`${key}:${value}\` added to every localization file!`);
}

const RemoveLocalizationKey = (key) => {
    const removeKey = (obj, objects, i) => {
        if (!(objects[i] in obj)) {
            return;
        }
        
        if (objects.length - 1 === i) {
            delete obj[objects[i]];
        } else {
            removeKey(obj[objects[i]], objects, i + 1);
            if (Object.keys(obj[objects[i]]).length === 0) {
                delete obj[objects[i]];
            }
        }
    }

    const objects = key.split('.');
    for (const [localePath, localeObj] of GetLocalizationObjects()) {
        removeKey(localeObj, objects, 0);

        // All the localization files seem to have a trailing new line, so add
        // one ourselves
        fs.writeFileSync(localePath, `${JSON.stringify(localeObj, null, 4)}\n`);
    }

    console.log(`\`${key}\` removed from every localization file!`);
}

const cliParser = yargs(hideBin(process.argv))
    .command({
        command: 'add <key> <value>',
        aliases: ['a'],
        desc: 'adds key and value to all localization files',
        handler: (argv) => AddLocalizationKey(argv.key, argv.value)
    })
    .command({
        command: 'remove <key>',
        aliases: ['rm', 'r'],
        desc: 'removes key from all localization files',
        handler: (argv) => RemoveLocalizationKey(argv.key)
    })
    .demandCommand(1)
    .example([
        ['$0 add foo.bar "I\'m adding a key!"', 'Adding a key as `foo.bar`'],
        ['$0 remove foo.bar', 'removes the foo.bar key']
    ])
    .help(false)
    .version(false)

cliParser
    .wrap(cliParser.terminalWidth())
    .command({
        command: 'help',
        aliases: ['h'],
        desc: 'Shows the help message',
        handler: () => cliParser.showHelp()
    })
    .fail(() => cliParser.showHelp())
    .parse()
