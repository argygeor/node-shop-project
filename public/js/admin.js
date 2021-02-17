const deleteProduct = (btn) => {
   const prodId = btn.parentNode.querySelector('[name=productID]').value;
   const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
   console.log(btn);
   const productElement = btn.closest('article');

   fetch('/admin/product/' + prodId, {
      method: 'DELETE',
      headers: {
         'csrf-token': csrf
      }
   })
      .then(result => {
         return result.json();
      })
      .then(data => {
         console.log(data);
         productElement.remove();
      })
      .catch(err => {
         console.log(err);
      });
}