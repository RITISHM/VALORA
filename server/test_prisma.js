const prisma = require('./src/prisma');

async function test() {
  try {
    // First, let's get any contact ID
    const contact = await prisma.contact.findFirst();
    if (!contact) {
      console.log("No contacts found");
      return;
    }

    const data = {
      name: "Pranav Jangid",
      type: "CUSTOMER",
      email: "pranav@gmail.com",
      mobile: "9888877779",
      city: "Faridabad",
      state: "Haryana",
      tax_rate: 10
    };

    console.log("Trying to update contact", contact.id);
    const result = await prisma.contact.update({
      where: { id: contact.id },
      data: data
    });
    console.log("Success:", result);
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
