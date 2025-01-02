const HD_IMAGES_PATH = [
  require('./images/leaf.jpg'),
  require('./images/autum-leaf.jpg'),
  require('./images/landscape.jpg'),
];

export function getImagePath(): string {
  const randomNumberFrom1To10 = Math.floor(Math.random() * 3);
  return HD_IMAGES_PATH[randomNumberFrom1To10];
}
