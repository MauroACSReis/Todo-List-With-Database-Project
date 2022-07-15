// require modules
const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose')

// start express and setup bodyParser
const app = express()
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

// Mongoose
const uri =
  'mongodb+srv://Mauro:2WhCgtbrBewuEStB@cluster0.fgz8whj.mongodb.net/?retryWrites=true'
mongoose.connect(uri, {
  useNewUrlParser: true,
  dbName: 'todoListDB'
})

const itemsSchema = {
  name: String
}

const Item = mongoose.model('Item', itemsSchema)

const item1 = new Item({
  name: 'Welcome'
})

const item2 = new Item({
  name: 'To'
})

const item3 = new Item({
  name: 'Index!'
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema)
// GET ROOT & DB
app.get('/', function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log('Default items set to DB')
        }
      })
      res.redirect('/')
    } else {
      res.render('list', { listTitle: 'Today', newListItems: foundItems })
    }
  })
})

// GET ABOUT
app.get('/about', function (req, res) {
  res.render('about')
})

// GET DYNAMIC
app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect('/' + customListName)
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  })
})

// POST
app.post('/', function (req, res) {
  const itemName = req.body.newItem
  const listName = req.body.list
  const item = new Item({
    name: itemName
  })

  if (listName === 'Today') {
    item.save()
    res.redirect('/')
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item)
      foundList.save()
      res.redirect('/' + listName)
    })
  }
})
app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log('Succesfully deleted checked item.')
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect('/' + listName)
        }
      }
    )
  }
})

// LISTEN to port
const port = 3000
app.listen(process.env.PORT || 3000, function () {
  console.log(`Server started at port ${port}.`)
}) // Heroku OR localhost:3000
