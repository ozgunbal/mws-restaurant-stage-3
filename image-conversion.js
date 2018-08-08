const sharp = require('sharp');
const util = require('util');
const fs = require('fs');

const imageDir = './client/img/'

const readDir = util.promisify(fs.readdir);
readDir(imageDir).then(images => {
    images.forEach(image => {

        const fileName = image.split('.')[0];

        sharp(imageDir + image)
            .resize(750)
            .webp()
            .toFile(imageDir + fileName + '.webp')
            .then(info => console.log(info));
    })
});