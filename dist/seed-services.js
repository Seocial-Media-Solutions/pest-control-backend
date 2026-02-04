import 'dotenv/config';
import mongoose from 'mongoose';
import Service from './src/models/service.model.js';
const services = [
    {
        title: 'termite control',
        description: 'Professional termite inspection, treatment, and prevention services to protect your property from wood-destroying pests.',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
        metaTitle: 'Termite Control Services - Professional Pest Management',
        metaDescription: 'Expert termite control and prevention services. Protect your home from termite damage with our comprehensive treatment solutions.',
        metaKeywords: 'termite control, termite treatment, termite inspection, pest control, wood pest',
        metaImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
        services: [
            {
                title: 'termite inspection',
                description: 'Comprehensive property inspection to detect termite activity and damage',
                startingPrice: 150,
                metaTitle: 'Professional Termite Inspection Services',
                metaDescription: 'Thorough termite inspection to identify infestations early',
                metaKeywords: 'termite inspection, pest inspection, termite detection',
                metaImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800'
            },
            {
                title: 'termite treatment',
                description: 'Advanced termite elimination using safe and effective methods',
                startingPrice: 500,
                metaTitle: 'Termite Treatment & Elimination',
                metaDescription: 'Professional termite treatment to eliminate infestations',
                metaKeywords: 'termite treatment, termite elimination, pest removal',
                metaImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800'
            },
            {
                title: 'termite prevention',
                description: 'Preventive measures and barriers to protect against future infestations',
                startingPrice: 300,
                metaTitle: 'Termite Prevention Services',
                metaDescription: 'Protect your property with our termite prevention solutions',
                metaKeywords: 'termite prevention, termite barrier, pest prevention',
                metaImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800'
            }
        ]
    },
    {
        title: 'rodent control',
        description: 'Effective rodent control solutions including mice and rat removal, prevention, and exclusion services.',
        image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800',
        metaTitle: 'Rodent Control Services - Mice & Rat Removal',
        metaDescription: 'Professional rodent control and removal services. Safe and effective solutions for mice, rats, and other rodents.',
        metaKeywords: 'rodent control, mice removal, rat control, pest control, rodent prevention',
        metaImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1200',
        services: [
            {
                title: 'mice removal',
                description: 'Safe and humane mice removal from residential and commercial properties',
                startingPrice: 200,
                metaTitle: 'Professional Mice Removal Services',
                metaDescription: 'Expert mice removal and control services',
                metaKeywords: 'mice removal, mouse control, rodent removal',
                metaImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800'
            },
            {
                title: 'rat control',
                description: 'Comprehensive rat control and elimination services',
                startingPrice: 250,
                metaTitle: 'Rat Control & Elimination Services',
                metaDescription: 'Professional rat control solutions for homes and businesses',
                metaKeywords: 'rat control, rat removal, rodent elimination',
                metaImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800'
            },
            {
                title: 'rodent exclusion',
                description: 'Seal entry points and prevent future rodent infestations',
                startingPrice: 350,
                metaTitle: 'Rodent Exclusion & Prevention',
                metaDescription: 'Keep rodents out with our exclusion services',
                metaKeywords: 'rodent exclusion, rodent prevention, pest proofing',
                metaImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800'
            }
        ]
    },
    {
        title: 'mosquito control',
        description: 'Mosquito control and prevention services to protect your family from mosquito-borne diseases.',
        image: 'https://images.unsplash.com/photo-1599843593095-e06ae7c6b0c3?w=800',
        metaTitle: 'Mosquito Control Services - Yard Treatment',
        metaDescription: 'Professional mosquito control and yard treatment services. Enjoy your outdoor space mosquito-free.',
        metaKeywords: 'mosquito control, mosquito treatment, yard spray, pest control, mosquito prevention',
        metaImage: 'https://images.unsplash.com/photo-1599843593095-e06ae7c6b0c3?w=1200',
        services: [
            {
                title: 'yard treatment',
                description: 'Comprehensive yard and outdoor area mosquito treatment',
                startingPrice: 180,
                metaTitle: 'Mosquito Yard Treatment Services',
                metaDescription: 'Professional yard treatment to eliminate mosquitoes',
                metaKeywords: 'yard treatment, mosquito spray, outdoor pest control',
                metaImage: 'https://images.unsplash.com/photo-1599843593095-e06ae7c6b0c3?w=800'
            },
            {
                title: 'mosquito barrier spray',
                description: 'Long-lasting barrier spray to keep mosquitoes away',
                startingPrice: 150,
                metaTitle: 'Mosquito Barrier Spray Treatment',
                metaDescription: 'Effective barrier spray for mosquito control',
                metaKeywords: 'mosquito barrier, barrier spray, mosquito prevention',
                metaImage: 'https://images.unsplash.com/photo-1599843593095-e06ae7c6b0c3?w=800'
            }
        ]
    },
    {
        title: 'cockroach control',
        description: 'Complete cockroach extermination and prevention services for homes and businesses.',
        image: 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=800',
        metaTitle: 'Cockroach Control & Extermination Services',
        metaDescription: 'Professional cockroach control and extermination. Get rid of roaches permanently with our proven methods.',
        metaKeywords: 'cockroach control, roach extermination, pest control, cockroach removal',
        metaImage: 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=1200',
        services: [
            {
                title: 'cockroach extermination',
                description: 'Complete cockroach elimination using advanced treatment methods',
                startingPrice: 220,
                metaTitle: 'Cockroach Extermination Services',
                metaDescription: 'Professional cockroach extermination and removal',
                metaKeywords: 'cockroach extermination, roach removal, pest elimination',
                metaImage: 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=800'
            },
            {
                title: 'german cockroach treatment',
                description: 'Specialized treatment for German cockroach infestations',
                startingPrice: 280,
                metaTitle: 'German Cockroach Treatment',
                metaDescription: 'Expert treatment for German cockroach problems',
                metaKeywords: 'german cockroach, cockroach treatment, roach control',
                metaImage: 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=800'
            }
        ]
    },
    {
        title: 'bed bug treatment',
        description: 'Effective bed bug detection, treatment, and elimination services for complete peace of mind.',
        image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800',
        metaTitle: 'Bed Bug Treatment & Extermination Services',
        metaDescription: 'Professional bed bug treatment and elimination. Get rid of bed bugs with our guaranteed services.',
        metaKeywords: 'bed bug treatment, bed bug extermination, pest control, bed bug removal',
        metaImage: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200',
        services: [
            {
                title: 'bed bug inspection',
                description: 'Thorough inspection to detect bed bug infestations',
                startingPrice: 120,
                metaTitle: 'Bed Bug Inspection Services',
                metaDescription: 'Professional bed bug detection and inspection',
                metaKeywords: 'bed bug inspection, bed bug detection, pest inspection',
                metaImage: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800'
            },
            {
                title: 'heat treatment',
                description: 'Chemical-free heat treatment to eliminate bed bugs',
                startingPrice: 800,
                metaTitle: 'Bed Bug Heat Treatment',
                metaDescription: 'Effective heat treatment for bed bug elimination',
                metaKeywords: 'heat treatment, bed bug removal, chemical-free pest control',
                metaImage: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800'
            },
            {
                title: 'chemical treatment',
                description: 'Professional chemical treatment for bed bug control',
                startingPrice: 400,
                metaTitle: 'Bed Bug Chemical Treatment',
                metaDescription: 'Safe and effective chemical treatment for bed bugs',
                metaKeywords: 'chemical treatment, bed bug control, pest treatment',
                metaImage: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800'
            }
        ]
    },
    {
        title: 'ant control',
        description: 'Comprehensive ant control services to eliminate ant colonies and prevent future infestations.',
        image: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=800',
        metaTitle: 'Ant Control & Extermination Services',
        metaDescription: 'Professional ant control and removal services. Eliminate ant problems with our effective treatments.',
        metaKeywords: 'ant control, ant removal, pest control, ant extermination',
        metaImage: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=1200',
        services: [
            {
                title: 'carpenter ant control',
                description: 'Specialized treatment for carpenter ant infestations',
                startingPrice: 250,
                metaTitle: 'Carpenter Ant Control Services',
                metaDescription: 'Professional carpenter ant treatment and removal',
                metaKeywords: 'carpenter ant, ant control, wood pest',
                metaImage: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=800'
            },
            {
                title: 'fire ant treatment',
                description: 'Effective fire ant mound treatment and yard protection',
                startingPrice: 180,
                metaTitle: 'Fire Ant Treatment Services',
                metaDescription: 'Professional fire ant control and yard treatment',
                metaKeywords: 'fire ant, ant treatment, yard pest control',
                metaImage: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=800'
            }
        ]
    }
];
async function seedServices() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Clear existing services
        await Service.deleteMany({});
        console.log('🗑️  Cleared existing services');
        // Insert new services
        const result = await Service.insertMany(services);
        console.log(`✅ Successfully added ${result.length} services:`);
        result.forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.title} (${service.services.length} sub-services)`);
        });
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('📊 You can now view these services in your admin panel at http://localhost:5174/services');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
    }
    finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
    }
}
// Run the seed function
seedServices();
