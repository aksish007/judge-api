import {db, Langs, LangsAttributes} from '../models'

db.sync()
  .then(() => Langs.sync({force:true}))
  .then(() =>
    Langs.bulkCreate(<LangsAttributes[]>[
      { lang_slug: 'py2', lang_name: 'Python', lang_version: '2.7' },
      { lang_slug: 'java8', lang_name: 'Java', lang_version: '1.8' },
      { lang_slug: 'nodejs6', lang_name: 'NodeJS', lang_version: '6' },
      { lang_slug: 'cpp', lang_name: 'C++', lang_version: '11' },
      { lang_slug: 'c', lang_name: 'C', lang_version: '6' }
    ]))
  .finally(() => {
    try {
      db.close()
    } catch (e) {

    }
  })
