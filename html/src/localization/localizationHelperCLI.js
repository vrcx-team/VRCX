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

// Shamelessly stolen from https://stackoverflow.com/a/55017155/11030436
const InsertKeyInObj = (obj, key, value, above_key) => {
    const keys = Object.keys(obj);
    if (keys.length === 0 || !(Object.hasOwn(obj, above_key))) {
        obj[key] = value;
        return obj;
    }

    // Reconstruct object from scratch, inserting our new key when the next
    // key is the above_key

    // Again utilize the dummy key in case we're adding above the first key
    keys.unshift('dummy');
    obj.dummy = {};
    const ret = keys.reduce((newObj, currKey, i) => {
        if (currKey !== key) {
            newObj[currKey] = obj[currKey];
        }

        if (i < keys.length - 1 && keys[i + 1] === above_key) {
            newObj[key] = value;
        }

        return newObj;
    }, {})
    delete ret.dummy;
    return ret;
}

const AddLocalizationKey = (key, value, above_key) => {
    // Use dummy key in case the user wants to add a key to the root json object
    // unlikely, but still a valid use case
    const objects = ['dummy', ...key.split('.')];

    for (const [localePath, localeObj] of GetLocalizationObjects()) {
        let dummy = { 'dummy': localeObj }
        let lastObj = dummy;
        let currentObj = dummy.dummy;
        // Have index start at one to skip the dummy key
        let i = 1;

        // Last element is final key not object so loop n - 1 times
        for (; i < objects.length - 1; i++) {
            if (!Object.hasOwn(currentObj, objects[i])) {
                currentObj[objects[i]] = {};
            }

            lastObj = currentObj;
            currentObj = currentObj[objects[i]];
        }
        lastObj[objects[i - 1]] = InsertKeyInObj(currentObj, objects[i], value, above_key);
        fs.writeFileSync(localePath, `${JSON.stringify(dummy.dummy, null, 4)}\n`);
    }

    console.log(`\`${key}:${value}\` added to every localization file!`);
}

const RemoveLocalizationKey = (key) => {
    const removeKey = (obj, objects, i) => {
        if (!(Object.hasOwn(obj, objects[i]))) {
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
        command: 'add <key> <value> [above_key]',
        aliases: ['a', 'replace', 'r'],
        desc: 'adds or replaces a key and value to all localization files above `above_key`',
        handler: (argv) => AddLocalizationKey(argv.key, argv.value, argv.above_key)
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
        ['$0 remove foo.bar', 'removes the foo.bar key'],
        ['$0 add foo.bar "I\'m adding a key!" baz', 'Adding a key aboe the existing `foo.baz` key']
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
