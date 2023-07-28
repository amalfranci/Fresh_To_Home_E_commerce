const categoryCollection = require("../models/categoryModel");

const postAddCategory = async (req, res) => {
  try {
    const { category, offer } = req.body;
    const icon = req.file.filename;

    // The 'offer' object will contain the offer details from the form
    const { percentage, startDate, endDate, description } = offer;

    const existingCategory = await categoryCollection.findOne({
      category: { $regex: category, $options: "i" },
    });

    if (existingCategory) {
      req.flash("error", "Category already exists");
      res.redirect("/admin/category");
    } else {
      const result = await categoryCollection.create({
        category,
        icon,
        offer: { percentage, startDate, endDate, description }, // Add the offer details
      });

      if (result) {
        // Category created successfully
        req.flash("success", "Category created successfully");
        res.redirect("/admin/category");
      } else {
        // Failed to create category
        req.flash("error", "Failed to create category");
        res.redirect("/admin/category");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};


const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, offer } = req.body;
    const category = await categoryCollection.findById(categoryId);

    category.category = name;

    // Update the offer details if provided in the request body
    if (offer) {
      const { percentage, startDate, endDate, description } = offer;
      category.offer = {
        percentage: percentage || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        description: description || "",
      };
    }

    if (req.file) {
      category.icon = req.file.filename;
    }

    await category.save();

    res.redirect("/admin/category");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
};




const deleteCategory = async (req, res, next) => {
  const categoryId = req.params.id;

  try {
    await categoryCollection.findByIdAndDelete(categoryId);
    
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
};
const unlistcategory= async (req,res)=>{
  let id=req.params.id
  console.log(id)
  try{
    let category= await categoryCollection.findById(id)
    console.log(category)
  
    category.deleted=!category.deleted;
    await category.save()
    res.redirect("/admin/category")
  }catch(err){
    console.log(err)
  }
}


module.exports = {
  editCategory,
  postAddCategory,

  unlistcategory,

  deleteCategory,
};
