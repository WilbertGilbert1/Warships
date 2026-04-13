import Experience from './Experience/Experience.js'

const mainmenuplaybutton = document.getElementById('mainmenuplaybutton')
const homepage = document.getElementById('homepage')
mainmenuplaybutton.addEventListener('click', ()=>
{
    console.log('cool')
    homepage.style.visibility = "hidden"
    const experience = new Experience(document.querySelector('canvas.webgl'))
})