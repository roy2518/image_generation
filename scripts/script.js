//Allow user to upload image
window.addEventListener('load', function() {
  document.querySelector('input[type="file"]').addEventListener('change', function() {
      if (this.files && this.files[0]) {
          target_image = document.querySelector('img');
          target_image.src = URL.createObjectURL(this.files[0]);
          target_image.onload = imageIsLoaded;
      }
  });
});

//Allow user to pause and resume
document.getElementById("start").onclick = function()
{
	if(target_image)
	{
		//Running
		if(myClock)
		{	
			document.getElementById("start").innerText = "Resume";
			clearInterval(myClock);
			myClock = null;
		}
		//Paused
		else
		{
			document.getElementById("start").innerText = "Pause";
			if(chromosomes.length === 0)
			{
				Population();
			}
			myClock = setInterval(generate, 0);
		}
	}
}
	//When new image is uploaded
	function imageIsLoaded(e)
	{
		chromosomes = [];
		if(myClock)
		{
			clearInterval(myClock);
			myClock = null;
		}
		document.getElementById("start").innerText = "Start";
		target_ctx.drawImage(target_image, 0, 0, target_canvas.width, target_canvas.height);
		target_RGB = target_ctx.getImageData(0, 0, target_canvas.width, target_canvas.height).data;

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, width, height);

	}

// //Initialization steps
var target_canvas = document.getElementById("target");
var target_ctx = target_canvas.getContext("2d");
var target_image = null;
var target_RGB = [];

var genetic_canvas = document.getElementById("genetic");
var width = genetic_canvas.width;
var height = genetic_canvas.height;
var ctx = genetic_canvas.getContext("2d");

var dummy_ctx = document.getElementById("dummy").getContext("2d");

var numCircles = 200;
var gene_length = 7;
var mutate_chance = 0.02;
var cutoff = 0.2;
var pop_size = 50;

//Represents our population
var chromosomes = [];

//Keep track of running or not
var myClock = null;

	//Initialize our population with pop_size chromosomes
	function Population()
	{
		for(var i = 0; i < pop_size; i++)
		{
			var result = Chromosome();
			chromosomes.push({
				dna:result[0],
				fitness:result[1]
			});
		}
	}

	//Crossover step: generation is replaced by children of generation
	function iterate()
	{
		chromosomes = chromosomes.sort(function(a, b) {
			//Sorted in decreasing fitness
			return b.fitness - a.fitness;
		});

		var children = [];

		//Random selection based on cutoff
		for(var i = 0; i < Math.ceil(cutoff * pop_size); i++) //7
		{
			for(var j = 0; j < Math.ceil(1 / cutoff); j++)
			{
				var random = i;
				while(random == i)
				{
					random = (Math.random() * Math.ceil(.15 * pop_size)) >> 0;
				}
				var result = Chromosome(chromosomes[i], chromosomes[random]);
				children.push({
					dna:result[0],
					fitness:result[1]
				});
			}
		}

		chromosomes = children;
		chromosomes.length = pop_size;

	}

	//Goes through all the generations, outputting the fittest of each generation
	function generate()
	{
		iterate();

		chromosomes = chromosomes.sort(function(a, b) {
			//Higher fitness is better
			return b.fitness - a.fitness;
		});

		var fittest = chromosomes[0].dna;

		draw(fittest, ctx);
	}

	//Draw a chromosome using the given context
	function draw(chromosome, context)
	{
		context.fillStyle = "#000000";
		context.fillRect(0, 0, width, height);
		for(var i = 0; i < chromosome.length; i += gene_length)
		{
			context.beginPath();
			context.arc(chromosome[i] * width, chromosome[i + 1] * height, chromosome[i + 2] * (width * .5), 0, 2 * Math.PI);
			context.closePath();
			style = "rgba(" + ((chromosome[i + 3] * 255) >> 0) + ", " + ((chromosome[i + 4] * 255) >> 0) + ", " + 
			((chromosome[i + 5] * 255) >> 0) + ", " + chromosome[i + 6] + ")";
			context.fillStyle = style;
			context.fill();
		}	
	}

	//Represents an individual chromosome within the popuulation
	function Chromosome(mother, father) 
	{
		this.dna = []
		if(mother && father)
		{
			//Crossover
			for(var i = 0; i < mother.dna.length; i++)
			{
				//More likely to inherit from parent that is more fit
				var threshold = mother.fitness / (mother.fitness + father.fitness);
				var gene = (Math.random() < threshold) ? mother.dna : father.dna;

				//Mutations
				var allele = gene[i];
				if(Math.random() < mutate_chance)
				{
					var delta = Math.random() * .15 * 2 - .15;
					if(Math.random() < 0.5)
					{
						allele -= delta;
					}
					else
					{
						allele += delta;
					}
					//Make in bounds
					if(allele < 0)
					{
						allele = 0;
					}

					if(allele > 1)
					{
						allele = 1;
					}
				}
				//Add allele
				this.dna.push(allele);
			}
		}
		//No parents, so random initialization
		else
		{
			for(var i = 0; i < numCircles; i++)
			{
				var X = Math.random();
				//Make sure not off the screen
				if(X < 0.05)
				{
					X = 0.05;
				}
				if(X > 0.95)
				{
					X = 0.95;
				}
				//Make sure not off the screen
				var Y = Math.random();
				if(Y < 0.05)
				{
					Y = 0.05;
				}
				if(Y > 0.95)
				{
					Y = 0.95;
				}
				this.dna.push(X);
				this.dna.push(Y);
				this.dna.push(Math.random() * 0.35); //Radius
				this.dna.push(Math.random()); //R
				this.dna.push(Math.random()); //G
				this.dna.push(Math.random()); //B
				this.dna.push(Math.max(Math.random() * Math.random(), 0.2)); //Transparency
			}
		}

		draw(this.dna, dummy_ctx);

		my_RGB = dummy_ctx.getImageData(0, 0, genetic_canvas.width, genetic_canvas.height).data;

		//Calculate fitness based on squared error
		this.fitness = 0;
		for(var i = 0; i < my_RGB.length; i++)
		{
			var d = target_RGB[i] - my_RGB[i];
			this.fitness += d * d;
		}

		this.fitness /= my_RGB.length;
		this.fitness = 100 / this.fitness;

		return [this.dna, this.fitness];
}